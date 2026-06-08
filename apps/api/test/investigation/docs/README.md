# Investigation & Debugging Scripts

This directory contains consolidated utility and debugging scripts for the NestJS API application.
All scripts are designed to dynamically load configuration parameters from the environment (e.g., from `.env` in `apps/api`) so you don't have to hardcode connection strings, API URLs, or model paths.

## Environment Dependencies

Ensure you have a `.env` file set up in `apps/api/` containing:
- `DATABASE_URL`: PostgreSQL connection URL (e.g. `postgresql://autonomous:autonomous_universal@localhost:5432/universal`)
- `LLM_BASE_URL`: Base URL for the LLM endpoint (e.g., `http://localhost:10030`)
- `LLM_CONVERSATION_MODEL`: Local model path or identifier (e.g. `/Users/harmanjitsingh/Workspace/models/Goggle-Gemma3-4bit` or `gemma3`)
- `EMBEDDING_BASE_URL`: Base URL for embedding server (e.g., `http://localhost:10020/v1`)
- `EMBEDDING_MODEL`: Name of the text embedding model (e.g., `nomic-embed-text-v1.5`)
- `PORT`: API server running port (default `8000`)

---

## Directory Index

### 1. Database Utilities & Tests

#### `db_connection_test.js`
- **Purpose**: Verifies PostgreSQL connection, lists all available tables in the public schema, and tests a chunk query.
- **Run**: 
  ```bash
  node apps/api/test/investigation/db_connection_test.js [optional_document_id]
  ```

#### `db_query_by_id.js`
- **Purpose**: Retrieves a document and all related text chunks from the database using their UUID.
- **Run**:
  ```bash
  node apps/api/test/investigation/db_query_by_id.js <uuid>
  ```

#### `fix_zero_embeddings.js`
- **Purpose**: Finds chunks with zero-vector embeddings (common after initial ingestion if embedding service was off) and updates them by querying the embedding service.
- **Run**:
  ```bash
  node apps/api/test/investigation/fix_zero_embeddings.js
  ```

---

### 2. LLM & Embeddings Server Verification

#### `ping_llm.js`
- **Purpose**: Checks connection to the local LLM. Pings `/v1/chat/completions` (and `/chat/completions` if v1 fails) and verifies response format.
- **Run**:
  ```bash
  node apps/api/test/investigation/ping_llm.js ["custom prompt text"]
  ```

#### `test_embedding_connection.js`
- **Purpose**: Verifies OpenAIEmbeddings setup, queries the embeddings endpoint, and returns vector length and snippet values.
- **Run**:
  ```bash
  node apps/api/test/investigation/test_embedding_connection.js
  ```

---

### 3. RAG Graph & Logic Tests

#### `test_langchain_query.js`
- **Purpose**: Tests prompt generation and JSON formatting for the query rewriter LLM chain.
- **Run**:
  ```bash
  node apps/api/test/investigation/test_langchain_query.js ["custom question"]
  ```

#### `test_query_rewriter_node.ts`
- **Purpose**: Directly executes the application's actual LangGraph `createQueryRewriterNode` initialized via NestJS `ConfigService` to test current prompt behavior and parser.
- **Run**:
  ```bash
  npx ts-node apps/api/test/investigation/test_query_rewriter_node.ts ["custom question"]
  ```

#### `test_vector_similarity.js`
- **Purpose**: End-to-end local similarity search verification. Retrieves embeddings for a query, and runs a PostgreSQL cosine similarity query to rank documentation chunks.
- **Run**:
  ```bash
  node apps/api/test/investigation/test_vector_similarity.js ["search term"] [optional_target_chunk_uuid]
  ```

---

### 4. System Evaluation

#### `rag_evaluation.ts`
- **Purpose**: Evaluates RAG quality against a hardcoded set of 6 golden question/answer pairs. Queries the RAG HTTP endpoint and uses the local LLM to score the responses (PASS/FAIL + reason).
- **Run**:
  ```bash
  npx ts-node apps/api/test/investigation/rag_evaluation.ts
  ```
