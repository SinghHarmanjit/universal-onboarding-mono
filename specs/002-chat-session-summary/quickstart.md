# Phase 1: Quickstart

## Getting Started

Once this feature is implemented, you will be able to see progressive summaries of your chat session.

### Dashboard UI

1. Open the Chat Dashboard.
2. Ensure you have the right sidebar or panel visible for the "Session Summary".
3. Start asking questions.
4. As the agent responds, the "Session Summary" will automatically populate with:
   - **Summarized Query**: A rewritten version of your question.
   - **Short Answer**: A condensed version of the agent's response.
5. If the agent returns relevant documentation, they will appear in the **Resources** section as clickable links.
6. If the agent cannot answer a question, it will be added to the **Open Questions** section. The agent may follow up with clarifying questions to refine these.

### Backend (Supervisor Agent)

1. The backend API is orchestrated by a Supervisor Agent.
2. The Supervisor Agent evaluates your query, dispatches to the RAG pipeline, and then decides whether to reply directly, ask clarifying questions (using MEDPIC framework), or queue open questions for the Sales Agent.
