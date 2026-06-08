# Phase 0: Outline & Research

## Unknowns Resolved

### 1. Node.js Version
- **Decision**: Node.js 20.x LTS.
- **Rationale**: Currently the most stable and widely supported LTS version for modern TypeScript and LangChain ecosystems.

### 2. API Framework & Streaming
- **Decision**: NestJS with Server-Sent Events (SSE).
- **Rationale**: NestJS provides a robust architectural framework and natively supports streaming responses using the `@Sse()` decorator. We will stream LangChain events token-by-token directly to the client as Server-Sent Events (`text/event-stream`).

### 3. Testing Framework
- **Decision**: Jest with `ts-jest` and `supertest`.
- **Rationale**: Supertest can test SSE streaming streams by listening to the response stream.

### 4. LLM Provider
- **Decision**: Gemini Gemma 3 (LLM) and nomic-embed-text-v1.5 (Embeddings) served locally.
- **Rationale**: User is running the models locally. We will pass the LLM and Embedding server URLs via environment variables and use compatible LangChain abstractions (e.g., standard OpenAI-compatible endpoints or Ollama integration).

### 5. Observability
- **Decision**: LangSmith.
- **Rationale**: Per clarifications, LangSmith is required to trace LangGraph execution, evaluate context quality, and identify conflicts during the merge phase.

### 6. Conflict Detection & Logging
- **Decision**: During the "Answer Generation" node, we will explicitly pass a prompt instruction to prioritize Docs over Business Knowledge if conflicting. If a conflict is detected by the LLM, we will use a structured output (or an additional LangChain callback) to set `conflict_flag = true` and log it to the analytics pipeline.

### 7. Automated API Document Ingestion
- **Decision**: Integrate with ReadMe API for fetching product documentation.
- **Rationale**: Since the product uses ReadMe (e.g., `https://reap.readme.io/docs`), we will configure the system with a `README_API_KEY`. The `DocsIngestService` will detect ReadMe URLs, extract the document slug, and directly query the ReadMe API (`GET https://dash.readme.com/api/v1/docs/{slug}`) to fetch the raw markdown content and metadata without requiring manual content uploads or web scraping.

## Technology Choices & Best Practices

### LangGraph Workflow
- **Best Practice**: Define an explicit State object with typed properties for `question`, `docs_results`, `business_results`, `citations`, and `final_answer`. The answer node will strictly refuse to answer if both `docs_results` and `business_results` are empty.

### Rate Limiting (Security)
- **Best Practice**: Since the MVP is unauthenticated for prospective customers, we must add basic IP-based rate limiting (e.g., using `@nestjs/throttler`) to prevent API abuse and cost exhaustion.
