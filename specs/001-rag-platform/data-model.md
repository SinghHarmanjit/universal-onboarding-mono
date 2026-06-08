# Data Model

## Entities

### `DocumentationDocument`
Represents an original uploaded public product documentation.
* **Fields**:
  * `id` (UUID, Primary Key)
  * `title` (String)
  * `source_url` (String, required)
  * `external_id` (String, nullable) - Stores ReadMe Doc slug or other external identifiers to prevent duplicates
  * `version` (String, nullable)
  * `metadata` (JSONB, nullable)
  * `created_at` (Timestamp)

### `DocumentationChunk`
Represents a chunked segment of a `DocumentationDocument` optimized for retrieval.
* **Fields**:
  * `id` (UUID, Primary Key)
  * `document_id` (UUID, Foreign Key -> `DocumentationDocument.id`)
  * `chunk_index` (Integer)
  * `section_heading` (String, nullable)
  * `content` (Text)
  * `token_count` (Integer)
  * `embedding` (Vector - pgvector)
  * `embedding_model` (String)
  * `metadata` (JSONB)
  * `created_at` (Timestamp)

### `BusinessKnowledgeEntry`
Represents a distinct piece of internal business knowledge (e.g., objection handling, competitive intelligence). Not necessarily chunked.
* **Fields**:
  * `id` (UUID, Primary Key)
  * `title` (String)
  * `content` (Text)
  * `category` (String)
  * `audience` (String)
  * `importance_score` (Float)
  * `embedding` (Vector - pgvector)
  * `embedding_model` (String)
  * `review_ownership` (String)
  * `expiration_date` (Timestamp, nullable)
  * `version` (Integer)
  * `approval_status` (String)
  * `metadata` (JSONB)
  * `created_at` (Timestamp)
  * `updated_at` (Timestamp)

### `RetrievalEvent` (Analytics)
Records a single retrieval/search action for observability.
* **Fields**:
  * `id` (UUID, Primary Key)
  * `session_id` (String)
  * `user_query` (Text)
  * `retrieved_item_id` (UUID - polymorphic, can point to `DocumentationChunk.id` or `BusinessKnowledgeEntry.id`)
  * `item_type` (Enum: `DOCUMENTATION`, `BUSINESS`)
  * `similarity_score` (Float)
  * `created_at` (Timestamp)

## Relationships
- A `DocumentationDocument` has many `DocumentationChunk`s.
- `RetrievalEvent` can reference a `DocumentationChunk` or a `BusinessKnowledgeEntry`.

## Validation Rules
- `source_url` is required for `DocumentationDocument` but not present on `BusinessKnowledgeEntry`.
- `expiration_date` checking is required before retrieving a `BusinessKnowledgeEntry`.
- `embedding` dimensions must match `nomic-embed-text-v1.5` (768 dimensions).

## LangGraph State Model
* **Fields**:
  * `question`: string
  * `query_variations`: string[]
  * `docs_results`: DocumentationChunk[]
  * `business_results`: BusinessKnowledgeEntry[]
  * `merged_context`: object (contains grouped docs and business context)
  * `citations`: Citation[]
  * `final_answer`: string
