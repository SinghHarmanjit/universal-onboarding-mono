# Feature Specification: Chat Session Summary

**Feature Branch**: `002-chat-session-summary`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "The dashboard hosting LLM chat is working fine. Now I want to enhance the UI and add information as per the progress of the chat. When user asks question and gets answer, I want to add those to Session Summary with Rewritten and Summarized User Query and similarly short answer from the RAG pipeline. Any resources discovered during this will be added to Resources as links. If there are open questions that agent could not answer, add another section for Questions for Reap Consultant."

## Clarifications

### Session 2026-06-08
- Q: How does the RAG pipeline extract resources and citations accurately? → A: RAG pipeline will be improved to return associated document names, section headings, and links (derived from `documentation_chunks` and `documentation_documents`) to create Citation objects.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Chat Progress Summaries (Priority: P1)

As a user, I want to see a summarized view of my chat progress as the session continues, so I can easily review the discussion without reading full messages.

**Why this priority**: Core feature requirement; provides an immediately accessible summary of the chat session.

**Independent Test**: Can be fully tested by simulating a Q&A exchange and verifying that the summary sections accurately reflect the conversation.

**Acceptance Scenarios**:

1. **Given** an active chat session, **When** the user asks a question and receives an answer, **Then** a "Session Summary" section is updated with a rewritten and summarized user query and a short answer from the RAG pipeline.

---

### User Story 2 - Track Discovered Resources (Priority: P2)

As a user, I want to see a list of resources discovered during the chat, so I can quickly access external links and documents without scrolling through the chat history.

**Why this priority**: Enhances the user experience by centralizing discovered materials.

**Independent Test**: Can be tested by having the agent return resources in its response and verifying they appear in the "Resources" section as links.

**Acceptance Scenarios**:

1. **Given** a chat response containing resource links, **When** the answer is processed, **Then** the links are added to the "Resources" section in the UI.

---

### User Story 3 - Track Unanswered Questions (Priority: P2)

As a user, I want to see a list of open questions the agent could not answer, so I can easily forward them to a Reap Consultant.

**Why this priority**: Provides a clear escalation path for unresolved queries.

**Independent Test**: Can be tested by simulating an "I don't know" response from the agent and verifying the query is added to the "Questions for Reap Consultant" section.

**Acceptance Scenarios**:

1. **Given** a user query that the agent cannot answer, **When** the agent indicates it cannot answer, **Then** the original query is added to the "Questions for Reap Consultant" section.

### Edge Cases

- What happens when a user asks a question but the backend fails to respond? (Summary should not update or should show an error indicator).
- How does the system handle very long user queries? (Summarizer should ensure the output remains short).
- What happens if the same resource is discovered multiple times? (Resources list should deduplicate links).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST summarize and rewrite user queries dynamically after a question is asked.
- **FR-002**: System MUST generate a short summarized version of the RAG pipeline's answer.
- **FR-003**: System MUST update the "Session Summary" UI section with the query and answer summaries in real-time or near real-time.
- **FR-004**: System MUST extract resources (links/documents) from the chat context and display them in a "Resources" section. The RAG pipeline MUST be improved to return the associated document names, section headings, and links (by resolving `documentation_chunks` to their parent `documentation_documents`) to create `Citation` objects.
- **FR-005**: System MUST identify when a question cannot be answered by the agent and add it to a "Questions for Reap Consultant" section.
- **FR-006**: System MUST persist these summaries for the duration of the chat session.

### Key Entities

- **SessionSummaryEntry**: Represents a paired summarized user query and summarized short answer.
- **DiscoveredResource / Citation**: Represents a link or document discovered during the chat. Contains document name, section heading, and source URL derived from the RAG pipeline resolving `documentation_chunks` to `documentation_documents`.
- **OpenQuestion**: Represents a user query that the agent was unable to answer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Session Summary updates appear within 2 seconds of the full answer being generated.
- **SC-002**: 100% of links returned by the RAG pipeline are captured in the Resources section.
- **SC-003**: 100% of questions explicitly marked as "unanswered" by the agent are added to the "Questions for Reap Consultant" section.
- **SC-004**: The UI layout remains clean and readable even after 20+ turns of conversation.

## Assumptions

- The backend RAG pipeline or an intermediate service provides the "rewritten/summarized query" and "short answer" metadata, or the frontend has a mechanism to request these summaries.
- The backend or the LLM response format includes a reliable way to indicate that a question could not be answered.
- Resources are returned in a parsable format (e.g., standard URLs or specific metadata fields).
