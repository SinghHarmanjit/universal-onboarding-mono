---
description: "Task list for RAG Knowledge Platform MVP 1"
---

# Tasks: RAG Knowledge Platform MVP 1

**Input**: Design documents from `/specs/001-rag-platform/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD approach is specified in plan.md, so test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure per implementation plan in apps/api/
- [x] T002 Verify NestJS project and install LangChain, LangGraph, and PostgreSQL dependencies
- [x] T003 [P] Verify TypeScript, linting, and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Setup PostgreSQL database with TypeORM and pgvector extension in apps/api/src/db/pgvector.ts
- [x] T005 Setup TypeORM migrations framework in apps/api/src/db/migrations/
- [x] T006 [P] Setup NestJS Knowledge Module and SSE controller structure in apps/api/src/knowledge/
- [x] T007 [P] Configure NestJS exception filters and logging infrastructure
- [x] T008 [P] Setup LangSmith tracing configuration in apps/api/src/config/langsmith.ts
- [x] T008a [P] Setup local Google Gemma3 LLM configuration (LOCAL_LLM_BASE_URL) in apps/api/src/config/llm.ts
- [x] T008b [P] Setup ReadMe API key configuration (README_API_KEY) in apps/api/src/config/readme.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Product Documentation RAG Pipeline (Priority: P1) 🎯 MVP

**Goal**: Setup the LangGraph orchestration framework and implement the Documentation retrieval pipeline with streaming SSE. This acts as the foundational workflow where additional models can be plugged in later.

**Independent Test**: Ingest a product document and query it via the API, verifying the SSE token-by-token stream.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Integration test for Docs Ingestion endpoint in apps/api/test/integration/docs_ingest.spec.ts
- [x] T010 [P] [US1] Integration test for Query API (SSE streaming) in apps/api/test/integration/query.spec.ts
- [x] T010a [P] [US1] Integration test for ReadMe API document ingestion in apps/api/test/integration/readme_ingest.spec.ts

### Implementation for User Story 1

- [x] T011 [P] [US1] Create DocumentationDocument TypeORM entity in apps/api/src/models/document.ts
- [x] T012 [P] [US1] Create DocumentationChunk TypeORM entity in apps/api/src/models/chunk.ts
- [x] T013 [P] [US1] Create Citation TypeORM entity in apps/api/src/models/citation.ts
- [x] T014 [US1] Implement Documentation Ingestion Service in apps/api/src/knowledge/services/docs_ingest.service.ts
- [x] T014a [US1] Update Documentation Ingestion Service to parse HTML to Markdown (turndown) and extract section headings in apps/api/src/knowledge/services/docs_ingest.service.ts
- [x] T014b [US1] Update Documentation Ingestion Service to detect ReadMe URLs and fetch content via ReadMe API (`GET /api/v1/docs/{slug}`) using `README_API_KEY`
- [x] T015 [US1] Implement Docs Retrieval Service in apps/api/src/knowledge/services/docs_retrieval.service.ts
- [x] T016 [US1] Define LangGraph State model in apps/api/src/knowledge/graph/state.ts
- [x] T017 [US1] Implement Query Rewriter node in apps/api/src/knowledge/graph/nodes/query_rewriter.ts
- [x] T018 [US1] Implement Docs Retrieval node in apps/api/src/knowledge/graph/nodes/docs_retriever.ts
- [x] T019 [US1] Implement Answer Generation node in apps/api/src/knowledge/graph/nodes/answer_generator.ts
- [x] T020 [US1] Assemble LangGraph workflow in apps/api/src/knowledge/graph/workflow.ts
- [x] T021 [US1] Implement Docs Ingestion endpoint (`POST /api/v1/documents`) in apps/api/src/knowledge/controllers/docs.controller.ts
- [x] T022 [US1] Implement Query API endpoint (`POST /api/v1/query`) with SSE streaming in apps/api/src/knowledge/controllers/query.controller.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP ready).

---

## Phase 4: User Story 2 - Business Knowledge Domain Integration (Priority: P2)

**Goal**: Plug in the Business Knowledge retrieval model as a distinct parallel node in the LangGraph workflow and merge contexts.

**Independent Test**: Ingest business knowledge entries and query the API to see them retrieved alongside documentation.

### Tests for User Story 2 ⚠️

- [x] T023 [P] [US2] Integration test for Business Knowledge Ingestion in apps/api/test/integration/business_ingest.spec.ts

### Implementation for User Story 2

- [x] T024 [P] [US2] Create BusinessKnowledgeEntry TypeORM entity in apps/api/src/models/business_knowledge.ts
- [x] T025 [US2] Implement Business Knowledge Ingestion Service (checking expiration logic) in apps/api/src/knowledge/services/business_ingest.service.ts
- [x] T026 [US2] Implement Business Knowledge Retrieval Service in apps/api/src/knowledge/services/business_retrieval.service.ts
- [x] T027 [US2] Implement Business Retrieval node for LangGraph in apps/api/src/knowledge/graph/nodes/business_retriever.ts
- [x] T028 [US2] Implement Context Merge node in apps/api/src/knowledge/graph/nodes/context_merger.ts
- [x] T029 [US2] Update LangGraph workflow to run Docs and Business retrieval as parallel distinct nodes in apps/api/src/knowledge/graph/workflow.ts
- [x] T030 [US2] Implement Business Knowledge Ingestion endpoint (`POST /api/v1/business-knowledge`) in apps/api/src/knowledge/controllers/business.controller.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently, demonstrating the parallel LangGraph orchestration.

---

## Phase 5: User Story 3 - Conflict Handling & Observability (Priority: P3)

**Goal**: Ensure strict refusal on missing context, prioritize docs over business knowledge on conflicts, and log RetrievalEvent analytics.

**Independent Test**: Query conflicting information and verify resolution prioritization. Verify refusal when no context is found. Check analytics logs.

### Tests for User Story 3 ⚠️

- [x] T031 [P] [US3] Integration test for conflict resolution and strict refusal in apps/api/test/integration/conflicts.spec.ts

### Implementation for User Story 3

- [x] T032 [P] [US3] Create RetrievalEvent TypeORM entity in apps/api/src/models/retrieval_event.ts
- [x] T033 [US3] Update Answer Generation node to prioritize Docs over Business Knowledge on conflicts and set conflict flag in apps/api/src/knowledge/graph/nodes/answer_generator.ts
- [x] T034 [US3] Update Answer Generation node to strictly refuse answering if no context is found in apps/api/src/knowledge/graph/nodes/answer_generator.ts
- [x] T035 [US3] Implement Analytics logging node to record RetrievalEvents into DB in apps/api/src/knowledge/graph/nodes/analytics_logger.ts
- [x] T036 [US3] Integrate Analytics logger node into the LangGraph workflow in apps/api/src/knowledge/graph/workflow.ts

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T037 [P] Finalize API documentation in docs/
- [x] T038 Code cleanup and formatting sweep across apps/api/
- [x] T039 Performance optimization for pgvector indexes
- [x] T040 Run quickstart.md validation locally

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion

### User Story Dependencies

- **User Story 1 (P1)**: Foundational LangGraph framework
- **User Story 2 (P2)**: Extends LangGraph workflow from US1 with parallel distinct nodes
- **User Story 3 (P3)**: Enhances Answer Generation node from US1/US2 with business logic and observability

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Database models across US1, US2, and US3 can be created concurrently
- Integration tests can be written concurrently with model development
