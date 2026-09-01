# Agents System Module Documentation

This document describes the design, architecture, and workflows of the Agents module in the NestJS API application (`apps/api/src/agents`).

---

## 1. Module Architecture & Directory Structure

The Agents module is organized as a modular NestJS module (`AgentsModule`):

*   **Module Definition**: `apps/api/src/agents/agents.module.ts`
*   **Controllers** (`/apps/api/src/agents/controllers/`):
    *   `supervisor.controller.ts`: Exposes the `POST /supervisor` endpoint which handles user queries, maintains conversation state, and returns a synthesized answer along with citations, facts, and the MEDDIC profile.
*   **Services** (`/apps/api/src/agents/services/`):
    *   `supervisor.service.ts`: Core service logic that sets up and invokes the active LangGraph supervisor workflow, handles prospect persistence, saves citations, and logs retrieval events.
*   **Active Graph Orchestration** (`/apps/api/src/agents/graph/supervisor/`):
    *   `supervisor_state.ts`: Defines the `SupervisorStateAnnotation` which stores the state of the graph (question, messages, prospectId, facts, meddic, product_result, business_result, final_answer, etc.).
    *   `supervisor_workflow.ts`: Defines the main active `StateGraph` that coordinates the `fact_extractor`, `meddic_manager`, `knowledge_planner`, and `response_composer` nodes.
    *   `nodes/response_composer.ts`: The final node that synthesizes product and business answers alongside the MEDDIC profile into a cohesive sales-oriented response.
*   **Alternative/Experimental Graph** (`/apps/api/src/agents/supervisor/`):
    *   Contains an alternative `StateGraph` implementation (`index.ts`) composed of `rag_retrieval`, `medpic_gathering`, and `sales_handoff` nodes.

---

## 2. Active Supervisor Workflow

The primary workflow orchestrated by `SupervisorService` (`agents/graph/supervisor/supervisor_workflow.ts`) operates sequentially to generate a comprehensive response.

### Nodes and Execution Flow

The workflow is built using LangGraph's `StateGraph` and executes in the following sequence:

1.  **Fact Extractor (`fact_extractor`)**:
    *   Invokes the `FactExtractionAgentService` (from the `prospect` module).
    *   Analyzes the latest messages to extract relevant facts about the prospect and stores them in the database (`ProspectFact`).
2.  **MEDDIC Manager (`meddic_manager`)**:
    *   Invokes the `MeddicAgentService`.
    *   Updates the MEDDIC profile for the prospect based on the conversation (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion).
    *   Returns the updated profile and a `suggested_question` to ask the prospect next.
3.  **Knowledge Planner (`knowledge_planner`)**:
    *   Executes the nested planner workflow (`createPlannerWorkflow` from the `knowledge` module).
    *   Retrieves relevant context by querying both Product Documentation and Business Knowledge systems.
4.  **Response Composer (`response_composer`)**:
    *   Synthesizes the outputs from the previous nodes.
    *   Uses an LLM prompt positioned as a "Sales Orchestrator" to blend technical capabilities seamlessly with business value.
    *   Adopts a consultative and authoritative tone, tailoring the response based on the MEDDIC profile, and transitions smoothly into the suggested discovery question to advance the conversation.

---

## 3. Alternative/Experimental Workflow

An alternative graph is defined in `apps/api/src/agents/supervisor/index.ts`. This workflow highlights an architecture centered around MEDPIC framework evaluation and human sales handoffs.

### Nodes and Execution Flow

1.  **RAG Retrieval (`rag_retrieval` in `nodes.ts`)**:
    *   Directly invokes `createProductWorkflow` to answer the question using Product Docs and Business Knowledge.
    *   Returns a short answer and rewrites the query for search optimization.
2.  **MEDPIC Gathering (`medpic_gathering` in `medpic.ts`)**:
    *   Evaluates the conversation history against the MEDPIC framework.
    *   Identifies missing critical information (e.g., success metrics) and prepares clarifying questions to be asked.
3.  **Sales Handoff (`sales_handoff` in `handoff.ts`)**:
    *   Packages unanswerable questions or complex situations.
    *   Transitions questions that have been pending for too long to a `ready_for_consultant` status, flagging them for human sales intervention.

---

## 4. Key Integrations & Dependencies

*   **Knowledge Module (`apps/api/src/knowledge/`)**: The agents rely on `DocsRetrievalService`, `BusinessRetrievalService`, and the `plannerWorkflow` to fetch necessary context for answers.
*   **Prospect Module (`apps/api/src/prospect/`)**: Provides the `FactExtractionAgentService` and `MeddicAgentService` for evaluating and persisting the sales state of a prospect.
*   **Database Entities (`apps/api/src/models/`)**:
    *   `Prospect`: Represents the user/company interacting with the system.
    *   `ProspectFact`: Stored insights from the fact extractor.
    *   `Citation` & `DocumentationDocument`: Used to trace the answer back to source documentation.
    *   `RetrievalEvent`: Logs retrieval details for observability.
