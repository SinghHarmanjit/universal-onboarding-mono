# RAG Knowledge Platform – MVP 1 Requirements

## Overview

Build a Retrieval Augmented Generation (RAG) platform that combines publicly available product documentation with internal Sales and Growth knowledge to provide accurate, source-backed responses to user questions.

The platform will use:

* PostgreSQL with pgvector
* LangChain (TypeScript)
* LangGraph (TypeScript)
* Google Gemma3 (LLM)
* nomic-embed-text-v1.5 (Embeddings)

The primary goal of MVP 1 is to provide reliable answers with traceable citations and links back to the original source material.

* **Enhancement**: Integrate with the ReadMe API to seamlessly fetch and ingest product documentation directly from a provided ReadMe URL (e.g., `https://reap.readme.io/docs`).

Image retrieval, multimodal search, and image embeddings are explicitly out of scope for MVP 1.

## Clarifications
### Session 2026-06-07
- Q: Security & Privacy (Auth/RBAC) - How should API access be secured for MVP given confidential Business Knowledge? → A: Option C (No authentication needed). Private information will be scrubbed before ingestion. Target users are prospective customers.
- Q: Interaction & UX Flow (Streaming) - How should the API deliver the generated answer? → A: Option A (Stream the answer token-by-token via SSE).
- Q: Edge Cases & Failure Handling (No Results) - How should the LLM behave if no relevant chunks are found? → A: Option A (Strictly refuse to answer, e.g. "I don't have information on that").
- Q: Edge Cases & Failure Handling (Conflicting Info) - How should conflicts between Docs and Business Knowledge be handled? → A: Option B+C (Prioritize Docs as absolute truth, ignore Business Knowledge conflict in answer, and log the conflict for internal review).
- Q: Observability (LLM Tracing) - How should we handle observability for the AI workflows? → A: Option A (Require LangSmith or equivalent integration for full LLM trace observability).
- Q: Integration & External Dependencies (Models) - Which LLM provider and model family should be used for embedding and answer generation in MVP 1? → A: Nomic-embed-text-v1.5 (embeddings) and Google Gemma3 (LLM).
- Q: Data Volume & Scale - What is the expected initial scale of documents (total chunks) to be ingested for MVP 1? → A: Option A (Small < 10k chunks, focusing initially on targeted docs like Reap Readme).
- Q: Completion Signals - How will answer quality be validated to sign-off on MVP 1 completion? → A: Option B (Automated LLM-as-a-judge evaluation using LangSmith/Ragas against a golden dataset).

---

# Functional Requirements

## Target Persona

* **Prospective Customers**: The primary users of the system.
* Since the system is public-facing and unauthenticated for MVP, all ingested content (especially Business Knowledge) must be curated and scrubbed of private, confidential, or internal-only information.

## Knowledge Domain Architecture

The platform shall maintain two independent knowledge domains:

### Product Documentation Domain

Contains:

* User guides
* Product features
* API documentation
* Configuration instructions
* Troubleshooting content
* Release notes

The Product Documentation Domain shall be considered the authoritative source for product functionality and behavior.

### Business Knowledge Domain

Contains curated, publicly-safe content derived from internal information:

* Sales playbooks
* Positioning guidance
* Competitive intelligence
* Pricing discussions
* Objection handling
* Customer success narratives
* Growth recommendations

The Business Knowledge Domain shall be considered the authoritative source for customer-facing messaging and commercial guidance.

---

# Separate Storage Requirements

## Documentation Repository

Documentation content shall be stored independently from Business Knowledge.

Documentation records shall support:

* document metadata
* chunking
* embeddings
* citations
* source URLs

The original document shall remain the authoritative source of truth. Chunk boundaries should preserve semantic meaning and avoid splitting sections unnecessarily. To ensure high-quality chunks, any raw HTML documents MUST be converted to Markdown before chunking to eliminate token bloat. Additionally, Markdown headers should be extracted to populate chunk metadata (e.g. `section_heading`) for precise semantic retrieval.

When syncing from ReadMe, the system shall capture and store ReadMe-specific identifiers (like page slug or ID) to manage updates and prevent duplicate ingestion.

## Business Knowledge Repository

Business Knowledge shall be stored in a dedicated repository.

Each knowledge item shall support:

* category
* audience
* importance score
* embedding
* metadata

Business Knowledge records are not required to have public URLs.

---

# Governance Requirements

Business Knowledge shall support:

* review ownership
* expiration dates
* versioning
* approval workflows

This allows outdated sales guidance to be retired without affecting documentation.

---

# Citation Support

## Source Attribution

Every retrieved record (documentation chunk or business knowledge entry) shall maintain sufficient metadata to allow citation generation.

The system must never generate citations that cannot be traced back to stored source metadata.

---

# Independent Retrieval Requirements

The platform shall maintain independent retrieval pipelines for:

## Documentation Retrieval

Responsible for:

* product facts
* configuration guidance
* feature explanations

## Business Knowledge Retrieval

Responsible for:

* positioning
* sales messaging
* objection handling
* commercial guidance

## Retrieval Orchestration

The system shall execute documentation retrieval and business knowledge retrieval independently.

Results shall be merged before answer generation.

Example:

```text
User Question
       |
       v
+----------------+
| Query Analysis |
+----------------+
       |
       v
  Parallel Search
   /          \
Docs      Business
Search     Search
   \          /
    \        /
      Merge
        |
        v
Answer
```

---

# Answer Generation

## Context Assembly

The answer generation process shall receive:

* Retrieved documentation chunks
* Retrieved business knowledge entries
* Citation metadata

The prompt shall preserve source attribution throughout the generation process.

## Answer Composition Rules

When both domains are used:

**Product Statements**
Must originate from Documentation.
Example:
*SSO supports Azure AD and Okta.*
Source: Product Documentation

**Commercial Statements**
Must originate from Business Knowledge.
Example:
*SSO is frequently used as a differentiator in enterprise sales discussions.*
Source: Business Knowledge

## Response Requirements

Generated responses shall:

* Answer the user's question directly
* Use retrieved knowledge as the primary source
* Include supporting citations
* Include links back to source documentation where available
* Distinguish between product facts and business messaging when relevant

## Edge Cases & Failure Handling

* **No Relevant Context**: If neither the Product Documentation nor Business Knowledge domains return relevant chunks for a user's query, the system shall strictly refuse to answer from base knowledge (e.g., "I don't have information on that"). This enforces strict source-backing and prevents hallucinations.
* **Conflicting Information**: If Product Documentation and Business Knowledge provide conflicting context, the system shall prioritize Product Documentation as the absolute truth and ignore the Business Knowledge assertion in the generated answer. The conflict must be logged for internal review.

---

# Citation Rendering

Responses shall include structured citations.

Example:

Source:

* User Management Guide → Creating Users
* Enterprise Pricing FAQ

Each documentation citation shall be linked to the original source URL. Business Knowledge citations may just cite internal identifiers or titles if URLs are not available.

---

# Retrieval Analytics

The platform shall record retrieval activity for observability and future optimization.

Each retrieval event shall capture:

* Session identifier
* User query
* Retrieved chunk or item identifier
* Similarity score
* Timestamp
* **Conflict Flag**: Boolean indicating if a conflict between Docs and Business Knowledge was detected during generation.

This information will be used for:

* Retrieval quality analysis
* Hallucination investigations
* Missing documentation identification
* Search tuning
* **Conflict Resolution**: Internal review of misaligned Business Knowledge versus Product Documentation.

---

# LangGraph Workflow

The MVP workflow shall consist of the following nodes:

1. User Question
2. Query Rewriter
3. Documentation Retrieval
4. Sales/Growth Retrieval
5. Context Merge
6. Answer Generation
7. Citation Formatting
8. Response Delivery

Documentation retrieval and business knowledge retrieval should execute in parallel whenever possible.

---

# Non-Functional Requirements

## Observability

The platform shall integrate full AI workflow tracing (e.g., using LangSmith) to provide visibility into LangGraph node execution, retrieved context quality, latency bottlenecks, and token usage.

## Performance

Target retrieval latency:

* Vector search: < 500ms
* End-to-end response generation: < 10 seconds (time to last token)
* Streaming: The API shall stream responses token-by-token via Server-Sent Events (SSE) to provide an immediately responsive user experience.

---

## Scalability

**Initial Scale (MVP 1)**: Small (< 10k chunks). The system will initially ingest a targeted subset of publicly available documentation (e.g., https://reap.readme.io/docs/getting-started) to allow for rapid iteration and quality tuning.

The architecture shall support future enhancements including:
* Hybrid search
* BM25 retrieval
* Reranking
* Multi-modal retrieval
* Image support
* Additional knowledge domains

without requiring significant database redesign.

---

# Answer Quality Validation (Definition of Done)

To validate answer quality and sign off on MVP 1 completion, the platform shall use automated LLM-as-a-judge evaluation (via LangSmith, Ragas, or equivalent) against a golden dataset of expected Q&A pairs, rather than relying solely on manual review.

---

# MVP 1 Exclusions
The following capabilities are explicitly excluded from MVP 1:
* Image retrieval
* Image embeddings
* OCR processing
* Multimodal search
* PDF page rendering
* Fine-tuned models
* Agentic workflows beyond retrieval and answer generation
* User feedback loops
* Knowledge graph generation

These capabilities may be introduced in subsequent releases.
