# Implementation Plan: Chat Session Summary

**Branch**: `002-chat-session-summary` | **Date**: 2026-06-08 | **Spec**: [spec.md](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/specs/002-chat-session-summary/spec.md)

**Input**: Feature specification from `/specs/002-chat-session-summary/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

This feature enhances the UI to display a progressive chat session summary, discovered resources (links), and open questions. On the backend, the flow transitions from a simple streaming RAG pipeline to a multi-agent workflow where a Supervisor Agent gathers inputs from the RAG pipeline and decides the next action. The Supervisor Agent will also employ MEDPIC sales techniques to elicit more information from the customer and build a business case before presenting it to the Sales Agent.

## Technical Context

**Language/Version**: TypeScript / Node.js
**Primary Dependencies**: LangChain / LangGraph (for Supervisor Agent and RAG pipeline), React (for UI)
**Storage**: In-memory or database (depends on existing chat history storage)
**Testing**: Jest (or equivalent existing test runner)
**Target Platform**: Web Dashboard / API Backend
**Project Type**: Web Application (Frontend + Backend)
**Performance Goals**: Real-time or near real-time updates as the chat progresses.
**Constraints**: Agent logic must smoothly handle fallback when RAG pipeline cannot answer.
**Scale/Scope**: Real-time processing for single chat sessions with multiple turns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Specification-Driven Development**: Meets requirement; feature was fully specified before planning.
- **Strict Component Consistency**: Requires frontend UI components (Heading, Paragraph, Link) to match existing design system.
- **Deterministic AI Workflows**: The new Supervisor Agent must have a deterministic state graph, clear transitions, and auditable tool usage. MEDPIC prompt structures must be structured and testable.
- **Collaboration & Predictability**: The agent states and transitions must be well-documented.
- **Test-Driven Development**: Must test Supervisor Agent routing and UI rendering of summaries.

*All gates passed.*

## Project Structure

### Documentation (this feature)

```text
specs/002-chat-session-summary/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
apps/api/
├── src/
│   ├── agents/
│   │   ├── supervisor/      # New Supervisor Agent logic with MEDPIC
│   │   └── rag/             # Existing RAG pipeline
│   └── routes/              # SSE stream updates
└── tests/

apps/dashboard/
├── src/
│   └── components/
│       ├── chat/            # Chat UI components
│       ├── session_summary/ # New UI components (Heading, Paragraph, Link)
│       └── resources/       # New UI components
└── tests/
```

**Structure Decision**: Web application consisting of frontend (dashboard) and backend (api).

## Complexity Tracking

No violations to justify.
