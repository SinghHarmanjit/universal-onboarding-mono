# Tasks: Chat Session Summary

**Input**: Design documents from `/specs/002-chat-session-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Supervisor Agent directory structure in `apps/api/src/agents/supervisor/`
- [x] T002 [P] Initialize UI component directories in `apps/dashboard/src/components/session_summary/` and `apps/dashboard/src/components/resources/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Define `SupervisorAgentState` interface in `apps/api/src/agents/supervisor/types.ts`
- [x] T004 Update backend SSE stream contract logic to support the new `summary` event structure in `apps/api/src/routes/chat.ts` (or equivalent route file)
- [x] T005 [P] Update frontend to parse the new `summary` event from SSE in `apps/dashboard/src/services/chatStream.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - View Chat Progress Summaries (Priority: P1) 🎯 MVP

**Goal**: As a user, I want to see a summarized view of my chat progress as the session continues.

**Independent Test**: Can be fully tested by simulating a Q&A exchange and verifying that the "Session Summary" section is updated with a rewritten query and short answer.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `SessionSummaryEntry` interface in frontend `apps/dashboard/src/types/sessionSummary.ts`
- [x] T007 [US1] Implement `SessionSummary` Heading and Paragraph UI components in `apps/dashboard/src/components/session_summary/SessionSummary.tsx`
- [x] T008 [US1] Integrate `SessionSummary` UI into the main Chat window in `apps/dashboard/src/components/chat/ChatLayout.tsx`
- [x] T009 [US1] Implement Supervisor Agent base graph and state transitions in `apps/api/src/agents/supervisor/index.ts`
- [x] T010 [US1] Implement Supervisor Agent logic to generate rewritten queries and short answers in `apps/api/src/agents/supervisor/nodes.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional.

---

## Phase 4: User Story 2 - Track Discovered Resources (Priority: P2)

**Goal**: As a user, I want to see a list of resources discovered during the chat.

**Independent Test**: Can be tested by having the agent return resources in its response and verifying they appear in the "Resources" section as links.

### Implementation for User Story 2

- [x] T011 [US2] Update RAG pipeline logic to resolve `documentation_chunks` to `documentation_documents` and return `Citation` objects in `apps/api/src/agents/rag/index.ts` (or equivalent RAG retriever logic)
- [x] T012 [P] [US2] Create `DiscoveredResource` interface in frontend `apps/dashboard/src/types/resources.ts`
- [x] T013 [US2] Implement `ResourcesList` Link UI components in `apps/dashboard/src/components/resources/ResourcesList.tsx`
- [x] T014 [US2] Integrate `ResourcesList` UI into `apps/dashboard/src/components/chat/ChatLayout.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Track Unanswered Questions (Priority: P2)

**Goal**: As a user, I want to see a list of open questions the agent could not answer, so I can forward them to a consultant.

**Independent Test**: Can be tested by simulating an "I don't know" response from the agent and verifying the query is added to the "Questions for Reap Consultant" section.

### Implementation for User Story 3

- [x] T015 [P] [US3] Create `OpenQuestion` interface in frontend `apps/dashboard/src/types/openQuestions.ts`
- [x] T016 [US3] Implement `OpenQuestions` Heading and Paragraph UI components in `apps/dashboard/src/components/session_summary/OpenQuestions.tsx`
- [x] T017 [US3] Implement MEDPIC Evaluator node in Supervisor Agent to ask clarifying questions in `apps/api/src/agents/supervisor/medpic.ts`
- [x] T018 [US3] Implement Sales Handoff node in Supervisor Agent to format unanswerable questions in `apps/api/src/agents/supervisor/handoff.ts`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T019 Write unit tests for Supervisor Agent state transitions in `apps/api/tests/agents/supervisor.test.ts`
- [x] T020 Run manual E2E tests to verify SSE streams full chat history correctly with final summary payload and clarifying questions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3) or in parallel if team capacity allows.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2).
- **User Story 3 (P3)**: Can start after Foundational (Phase 2).

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models/types within a story marked [P] can run in parallel with API updates.

---

## Parallel Example: User Story 1

```bash
# Launch UI components and API base graph together:
Task: "Implement SessionSummary Heading and Paragraph UI components in apps/dashboard/src/components/session_summary/SessionSummary.tsx"
Task: "Implement Supervisor Agent base graph and state transitions in apps/api/src/agents/supervisor/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
