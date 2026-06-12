# Phase 0: Research & Architecture Decisions

## 1. UI Components for Chat Dashboard

**Decision**: The Session Summary will utilize standard Heading and Paragraph components. Discovered Resources will primarily use Link components. Open Questions will be displayed using Heading and Paragraph components, but with interactive elements allowing the agent to ask clarifying questions to refine the Open Question.

**Rationale**: The user explicitly requested these specific component types. Standardized typography components ensure visual consistency and accessibility. Adding an interactive element to Open Questions allows the agent to refine ambiguity before handing off to a human consultant.

**Alternatives Considered**: Accordions or cards were considered for Session Summary but rejected in favor of the requested Headings and Paragraphs for simplicity and direct readability.

## 2. Supervisor Agent & Backend Flow

**Decision**: The backend flow will evolve from a direct RAG pipeline stream to a multi-agent structure managed by a Supervisor Agent. The Supervisor Agent will gather inputs from the RAG pipeline and decide the next course of action.

**Rationale**: This fulfills the user's architectural requirement to move away from a simple streaming RAG output to a decision-making entity that orchestrates the flow.

**Alternatives Considered**: Extending the existing RAG pipeline with conditional routing inside a single graph was considered, but delegating to a dedicated Supervisor Agent provides better separation of concerns for future multi-agent expansion.

## 3. MEDPIC Sales Technique Integration

**Decision**: The Supervisor Agent will incorporate the MEDPIC sales methodology (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion) to actively elicit more information from the customer. This builds a robust business case that is presented to a Sales Agent prior to scheduling a meeting.

**Rationale**: This directly implements the user's requirement to align the agent's conversational strategy with enterprise sales processes.

**Alternatives Considered**: Implementing custom heuristic question-asking was considered, but using an established framework like MEDPIC ensures structured and proven information gathering.
