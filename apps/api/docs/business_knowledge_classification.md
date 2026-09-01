# Business Knowledge Classification

## Overview

The `BusinessIngestService` (`apps/api/src/knowledge/services/business_ingest.service.ts`) handles the ingestion and classification of business documentation into the knowledge base. It is designed to take raw business text, chunk it intelligently, and use Large Language Models (LLMs) to extract highly structured sales intelligence and business facts. This classified data is designed to power downstream Business Workflow RAG pipelines.

## Ingestion Pipeline

The ingestion process runs through several automated steps to enrich and index the documentation:

### 1. Document Chunking
Text content is split into smaller, semantic chunks based on Markdown H2 headers (`## `). If no headers are present, the entire content is processed as a single chunk.

### 2. MEDDIC Sales Classification
Each chunk is evaluated against the **MEDDIC** sales framework. An LLM categorizes the text into one or more of the following categories:
- **M**etrics
- **E**conomic Buyer
- **D**ecision Criteria
- **D**ecision Process
- **I**dentify Pain
- **C**hampion

The resulting categories are stored in the `metadata.meddic_category` field of the `BusinessKnowledgeEntry`.

### 3. Knowledge Embedding
The content chunk is embedded using the system's vector model (Nomic). 
- **Prefix**: The text is prefixed with `search_document: ` before embedding.
- **Dimensions**: The vector is sliced to the configured `NOMIC_EMBEDDING_DIMENSIONS`.
- The embedding and the model name are stored directly on the `BusinessKnowledgeEntry`.

### 4. Structured Entity Extraction
After the main chunk is ingested, an LLM specifically analyzes it to extract discrete business concepts into a structured JSON schema. These entities are saved as `BusinessEntity` records and linked to the parent `BusinessKnowledgeEntry`.

---

## Business Entities Schema

The system supports the extraction of **9 distinct business entity types**. This structured metadata enables precise, faceted RAG retrieval for business workflows, as the RAG system can query by specific entity types (e.g., pulling all `pricing_model` entities).

### 1. Industry Use Case (`industry_use_case`)
Represents a common industry workflow where the product creates value.
- `industry`: Target industry
- `sub_industry`: Optional niche
- `persona_targets`: Array of relevant buyers
- `current_state`: Array describing the current approach
- `pain_points`: Array of business pains
- `solution`: Array of product solutions
- `product_features`: Array of relevant features
- `business_outcomes`: Array of expected outcomes

### 2. Pain Pattern (`pain_pattern`)
Represents a recurring operational or commercial problem.
- `industry`: Industry
- `pain_name`: Short pain name
- `description`: Pain summary
- `symptoms`: Array of observable symptoms
- `affected_teams`: Array of impacted teams
- `severity`: `low` | `medium` | `high`
- `current_alternatives`: Array of current workarounds
- `solution`: Recommended solution

### 3. Industry Benchmark (`industry_benchmark`)
Represents measurable industry performance data.
- `industry`: Industry
- `metric`: Metric name
- `value`: Primary value
- `unit`: Unit of measurement
- `low` / `high`: Optional bounds
- `before` / `after`: Optional baseline and improved state
- `benchmark_type`: `fraud` | `cost` | `revenue` | `efficiency` | `operations`
- `source_confidence`: `high` | `medium` | `low`

### 4. Success Story (`success_story`)
Represents a customer outcome.
- `industry`: Industry
- `customer_type`: Customer segment
- `customer_size`: `Startup` | `SMB` | `MidMarket` | `Enterprise`
- `pain_points`: Array of original pains
- `solution`: Array of implemented solutions
- `implementation_weeks`: Number of weeks
- `outcomes`: Key-value pairs of metrics and values
- `business_results`: Array of business outcomes

### 5. Pricing Model (`pricing_model`)
Represents commercial structures.
- `pricing_type`: `Revenue Share` | `SaaS` | `Transaction Fee`
- `best_fit`: Array of suitable customer types
- `minimum_scale`: Key-value pair (metric: value)
- `advantages` / `disadvantages`: Arrays of pros and cons
- `revenue_drivers`: Array of drivers
- `commercial_notes`: Array of notes

### 6. Revenue Opportunity (`revenue_opportunity`)
Represents new revenue creation.
- `industry`: Industry
- `revenue_source`: `Interchange` | `Subscription` | `Float`
- `description`: Revenue explanation
- `qualifying_signals`: Array of signals prospect is eligible
- `economic_buyer_relevance`: `low` | `medium` | `high`
- `revenue_drivers`: Array of what increases revenue

### 7. Timeline Pattern (`timeline_pattern`)
Represents implementation or delivery expectations.
- `industry`: Industry
- `project_type`: Project category
- `typical_duration_weeks` / `minimum_duration_weeks` / `maximum_duration_weeks`: Numeric ranges
- `dependencies`: Array of key dependencies
- `risk_factors`: Array of delay factors
- `accelerators`: Array of factors speeding delivery

### 8. Competitive Position (`competitive_position`)
Represents competitive intelligence.
- `competitor`: Competitor name
- `industry`: Industry
- `competitor_strengths`: Array of strengths
- `our_advantages`: Array of advantages
- `our_weaknesses`: Array of weaknesses (if documented)
- `replacement_triggers`: Array of reasons prospects switch
- `proof_points`: Array of supporting evidence

### 9. Objection (`objection`)
Represents a known objection and response strategy.
- `objection_type`: `pricing` | `implementation` | `security` | `compliance`
- `buyer_persona`: Relevant persona
- `sales_stage`: `discovery` | `evaluation` | `procurement`
- `objection_text`: Typical objection
- `root_cause`: Underlying concern
- `response_strategy`: Array of recommended actions
- `supporting_assets`: Array of related entity names
- `severity`: `low` | `medium` | `high`

---

## Entity Vector Embeddings

Each extracted entity is individually embedded into the vector database. This allows the RAG pipeline to directly surface structured facts.
- **Embedding Source Text**: 
  The entity's name, type, and stringified JSON attributes are combined:
  \`\`\`text
  search_document: Entity Name: {entity_name}
  Type: {entity_type}
  Attributes: {JSON.stringify(attributes)}
  \`\`\`
- The resulting vector is stored in the `BusinessEntity.embedding` field.

## Implications for the Business Workflow RAG Pipeline

When building the RAG pipeline for the business workflow:
1. **Faceted Search**: Leverage the `entity_type` field to filter context. If a user asks "how do we price this?", filter for `pricing_model` entities before running vector search.
2. **MEDDIC Routing**: RAG prompts can dynamically adapt based on the retrieved chunk's `meddic_category`. For example, if generating a pitch deck, prioritize chunks categorized as "Metrics" and "Identify Pain".
3. **Dual-Retrieval Strategy**: 
   - Retrieve broad contextual `BusinessKnowledgeEntry` records for general knowledge.
   - Retrieve focused `BusinessEntity` records for specific data points (e.g., `industry_benchmark`, `competitive_position`) to ensure precise, fact-based LLM responses without hallucinations.
