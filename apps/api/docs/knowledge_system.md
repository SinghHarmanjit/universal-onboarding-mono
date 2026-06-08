# RAG Knowledge System Module Documentation

This document describes the design, architecture, key details, and gotchas of the RAG Knowledge System module in the NestJS API application (`apps/api/src/knowledge`).

---

## 1. Module Architecture & Directory Structure

The Knowledge module is organized as a modular NestJS module:

*   **Module Definition**: [knowledge.module.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/knowledge.module.ts)
*   **Controllers** (`/apps/api/src/knowledge/controllers/`):
    *   [query.controller.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/controllers/query.controller.ts): Handles client streaming questions via Server-Sent Events (SSE) under the `/query` endpoint.
    *   [docs.controller.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/controllers/docs.controller.ts): Exposes `/documents` to trigger public document ingestion.
    *   [business.controller.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/controllers/business.controller.ts): Exposes `/business-knowledge` for ingesting curated internal business knowledge.
    *   [observability.controller.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/controllers/observability.controller.ts): Exposes `/logs` to retrieve the latest 50 debug/action logs.
*   **Services** (`/apps/api/src/knowledge/services/`):
    *   [docs_ingest.service.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/services/docs_ingest.service.ts): Handles fetching and chunking ReadMe markdown documents and saving them to the database.
    *   [docs_retrieval.service.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/services/docs_retrieval.service.ts): Computes query embeddings and retrieves documentation chunks using cosine distance.
    *   [business_ingest.service.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/services/business_ingest.service.ts): Ingests and embeds internal Sales/Growth business knowledge.
    *   [business_retrieval.service.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/services/business_retrieval.service.ts): Retrieves active (non-expired) business knowledge entries.
*   **LangGraph Workflow** (`/apps/api/src/knowledge/graph/`):
    *   [state.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/state.ts): Defines the RAG graph state annotation schema.
    *   [workflow.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/workflow.ts): Orchestrates parallel retrieval, context merging, LLM answer generation, and logging.
    *   **Nodes** (`/apps/api/src/knowledge/graph/nodes/`):
        *   [query_rewriter.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/query_rewriter.ts): Generates 3 search variations optimized for keywords.
        *   [docs_retriever.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/docs_retriever.ts) / [business_retriever.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/business_retriever.ts): Performs parallel vector retrieval.
        *   [context_merger.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/context_merger.ts): Collects both datasets.
        *   [answer_generator.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/answer_generator.ts): Renders prompt context and invokes the LLM.
        *   [analytics_logger.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/analytics_logger.ts): Saves the session retrieval metadata in the database.

---

## 2. Separate Storage Domain Schema

The system isolates documentation from business/sales knowledge in PostgreSQL. The key models are:

1.  **Documentation Domain**:
    *   [DocumentationDocument](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/models/document.ts): Metadata for each ingested page (source URL, title, ReadMe external slug, version).
    *   [DocumentationChunk](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/models/chunk.ts): Text chunks of documents containing the section heading, content, and the vector embedding.
2.  **Business Knowledge Domain**:
    *   [BusinessKnowledgeEntry](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/models/business_knowledge.ts): Flat records of Sales/Growth insights containing categorization, approval status (`PENDING`, `APPROVED`), and expiration dates.

---

## 3. Crucial Gotchas & Nuances

### ⚠️ Gotcha A: Dimensionality & Matryoshka Slicing
*   **The Issue**: The Nomic model (`nomic-embed-text-v1.5`) naturally generates **768-dimensional** vector embeddings. However, the TypeORM database schemas restrict vector storage to **192 dimensions**:
    *   In `chunk.ts`: `@Column({ type: 'vector', length: 192 })`
    *   In `business_knowledge.ts`: `@Column({ type: 'vector', length: 192 })`
*   **The Resolution**: The system leverages Nomic's Matryoshka property. Slices of the embedding are taken down to `192` elements:
    ```typescript
    if (embeddingVector.length > NOMIC_EMBEDDING_DIMENSIONS) {
      embeddingVector = embeddingVector.slice(0, NOMIC_EMBEDDING_DIMENSIONS);
    }
    ```
    > [!IMPORTANT]
    > Always ensure that any raw embeddings queried from external APIs or test scripts are truncated to `192` dimensions prior to comparing or saving to the database, otherwise PostgreSQL will throw a dimension mismatch error.

### ⚠️ Gotcha B: Zero-Vector Embeddings (`[0,0,0...]`)
*   **The Issue**: If the embedding service is offline or unreachable during ingestion (or if a format mismatch occurs), the system might ingest chunks with zero-vector embeddings (e.g. `[0,0,0...]`). 
*   **The Cause**: Setting `encodingFormat: 'float'` in `OpenAIEmbeddings` may return arrays of zeros if the local embedding API fails silently, returns bad content, or has a compatibility issue under load.
*   **The Mitigation**:
    *   Inspect `documentation_chunks` for zero vectors:
        ```sql
        SELECT id, content FROM documentation_chunks WHERE embedding::text LIKE '[0,0,0,0,0%';
        ```
    *   Fix them by running the utility script:
        ```bash
        node apps/api/test/investigation/fix_zero_embeddings.js
        ```
        This script finds all zero embeddings and updates them using the active embeddings service.

### ⚠️ Gotcha C: Inconsistent Nomic Query Prefixing
*   **The Issue**: `nomic-embed-text-v1.5` requires specific prefixes depending on whether text is being indexed or searched. If prefixes are omitted or mismatched, cosine similarity searches will return poor rankings.
*   **The Pattern**:
    *   **Product Documentation Ingestion**: Uses `search_document: ${chunkContent}` prefix.
    *   **Product Documentation Retrieval**: Uses `search_query: ${query}` prefix.
    *   **Business Knowledge Ingestion**: **Gotcha!** Currently ingest calls `embedQuery(data.content)` with **no prefix** (see [business_ingest.service.ts:49](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/services/business_ingest.service.ts#L49)).
    *   **Business Knowledge Retrieval**: Uses `search_query: ${query}` prefix.
    > [!WARNING]
    > Because Business Knowledge is ingested without the `search_document: ` prefix, similarity retrieval queries using the `search_query: ` prefix may suffer from reduced matching accuracy. Keep this in mind when debugging Sales/Growth search issues.

---

## 4. Key Retrieval Policies & Logic

### ReadMe Ingestion Trick
ReadMe documentation URLs (e.g. `https://reap.readme.io/docs/slug`) are fetched directly by appending `.md` to the URL. This bypasses client-side HTML rendering, scraping restrictions, and avoids Git-backed auth issues by requesting raw Markdown directly.

### Strict Refusal Policy
In [answer_generator.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/answer_generator.ts), if parallel retrievers return `0` chunks combined:
*   The LLM **strictly refuses to answer** and issues a fallback response:
    > "I'm sorry, but I couldn't find any relevant documentation or business knowledge to answer your question. How else may I assist you today?"
*   This prevents model hallucination of product facts when relevant context is missing.

### Domain Prioritization & Conflict Logging
When context overlaps:
1.  **Docs override Business Knowledge**: If documentation conflicts with internal Sales/Growth notes, the generator prompt instructs the model to prioritize Product Documentation.
2.  **Observability Flag**: The [analytics_logger.ts](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/src/knowledge/graph/nodes/analytics_logger.ts) logs a database `RetrievalEvent` with `has_conflict: true` if chunks are fetched from both domains simultaneously, facilitating human audit of possible info discrepancies.
