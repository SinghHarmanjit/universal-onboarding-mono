# Phase 1: Data Model

## Entities

### `SessionSummaryEntry`
Represents a paired summarized user query and summarized short answer.
- `id` (string): Unique identifier for the summary.
- `sessionId` (string): The chat session identifier.
- `rewrittenQuery` (string): The user's original query, rewritten and summarized.
- `shortAnswer` (string): A short, summarized version of the agent's RAG pipeline response.
- `createdAt` (timestamp): When the summary was generated.

### `DiscoveredResource`
Represents a link or document discovered during the chat.
- `id` (string): Unique identifier.
- `sessionId` (string): The chat session identifier.
- `title` (string): Title of the resource.
- `url` (string): The hyperlink to the resource.
- `createdAt` (timestamp): When the resource was discovered.

### `OpenQuestion`
Represents a user query that the agent was unable to answer or needs clarification on.
- `id` (string): Unique identifier.
- `sessionId` (string): The chat session identifier.
- `heading` (string): The topic or core question.
- `paragraph` (string): Detailed context around the open question.
- `clarificationNeeded` (boolean): Flag indicating if the agent needs to ask clarifying questions.
- `status` (string): e.g., "pending_clarification", "ready_for_consultant".
- `createdAt` (timestamp): When the open question was identified.

### `SupervisorAgentState`
Represents the internal state of the Supervisor Agent orchestrating the workflow.
- `messages` (array): The conversation history.
- `currentPhase` (string): E.g., "rag_retrieval", "medpic_gathering", "sales_handoff".
- `medpicState` (object): Track progress of MEDPIC fields (Metrics, EconomicBuyer, DecisionCriteria, DecisionProcess, IdentifyPain, Champion).
- `ragOutput` (object): Captured output from the RAG pipeline.
