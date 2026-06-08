# API Contract

## `POST /api/v1/query`

Submits a question to the RAG platform. Both Documentation and Business Knowledge pipelines are queried independently.

### Request Body
```json
{
  "question": "How do I create a new user account and how should I position it?",
  "session_id": "optional-uuid"
}
```

### Response (200 OK, Content-Type: text/event-stream)
Responses are streamed token-by-token via Server-Sent Events (SSE).

```text
event: metadata
data: {"session_id": "returned-or-generated-uuid"}

event: content
data: {"token": "To "}

event: content
data: {"token": "create "}

event: content
data: {"token": "a "}

event: citations
data: [{"source_type": "DOCUMENTATION", "title": "User Management Guide", "url": "..."}]

event: done
data: {}
```

## `POST /api/v1/documents` (Documentation Ingestion)

Ingests a public product documentation document, triggering chunking and embedding.

### Request Body
```json
{
  "title": "User Management Guide",
  "source_url": "https://docs.example.com/user-management",
  "content": "Full markdown or text content here...",
  "version": "v1.2.0",
  "metadata": {}
}
```

### Response (201 Created)
```json
{
  "document_id": "uuid",
  "chunks_created": 15
}
```

## `POST /api/v1/business-knowledge` (Business Knowledge Ingestion)

Ingests an internal business knowledge entry (e.g., positioning, objection handling).

### Request Body
```json
{
  "title": "Enterprise SSO Positioning",
  "content": "SSO is a key differentiator...",
  "category": "positioning",
  "audience": "Enterprise AEs",
  "importance_score": 9.5,
  "review_ownership": "sales-enablement@example.com",
  "expiration_date": "2026-12-31T23:59:59Z",
  "metadata": {}
}
```

### Response (201 Created)
```json
{
  "entry_id": "uuid"
}
```
