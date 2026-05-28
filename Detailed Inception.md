# Detailed Inception — AI Sales Assistant

**Project Name:** Universal Onboarding — AI Sales Assistant  
**Document Version:** 1.0  
**Created:** 2026-05-25  
**Status:** Inception / Pre-Development  

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Target Users & Personas](#3-target-users--personas)
4. [User Journey](#4-user-journey)
5. [System Architecture](#5-system-architecture)
6. [Agent Design](#6-agent-design)
7. [Knowledge Base & RAG Pipeline](#7-knowledge-base--rag-pipeline)
8. [MEDDPICC Qualification Framework](#8-meddpicc-qualification-framework)
9. [Frontend — UI/UX Specification](#9-frontend--uiux-specification)
10. [Tech Stack](#10-tech-stack)
11. [Data Flow & Sequence Diagrams](#11-data-flow--sequence-diagrams)
12. [Security & Guardrails](#12-security--guardrails)
13. [Phased Delivery Plan](#13-phased-delivery-plan)
14. [Open Decisions & Assumptions](#14-open-decisions--assumptions)
15. [Glossary](#15-glossary)

---

## 1. Problem Statement

### Context

Enterprise service providers rely on 30-minute discovery/sales calls to understand a prospective client's needs and present their solution. This format has inherent limitations:

- **Time-constrained**: 30 minutes is insufficient to deeply understand the prospect's pain points, decision-making process, and success criteria.
- **Information asymmetry**: The prospect leaves the call without comprehensive product knowledge. The sales rep leaves the call with incomplete qualification data.
- **No asynchronous support**: After the call, the prospect has no interactive way to continue exploring the product or revisit what was discussed.
- **Manual qualification**: Sales reps manually assess lead quality using frameworks like MEDDPICC, which is time-consuming and inconsistent.

### Core Problem

There is no pre-meeting touchpoint that simultaneously:

1. Educates the prospect about the product/services interactively.
2. Qualifies the prospect using structured sales methodologies (MEDDPICC).
3. Generates actionable intelligence for the sales team before the first call.

---

## 2. Solution Overview

### What We Are Building

An **AI Sales Assistant** — a web-based application that prospective clients interact with **before** booking a sales meeting. It serves two purposes simultaneously:

1. **For the Prospect (visible):** An intelligent chatbot with deep product knowledge that answers questions, surfaces relevant resources, and acts as an always-available sales representative.
2. **For the Sales Team (behind the scenes):** A qualification engine that extracts MEDDPICC signals from the conversation and produces a structured lead brief.

### What This Is NOT

- This is **not** a co-pilot for sales reps during live calls.
- This is **not** a generic customer support chatbot.
- This is **not** a form or survey tool.
- This does **not** replace the sales meeting — it enriches it.

### Value Proposition

| Stakeholder | Value Delivered |
|---|---|
| **Prospect** | Immediate, 24/7 access to product knowledge. Personalised answers. Saved Q&A for their team. No waiting for a sales call to get basic questions answered. |
| **Sales Rep** | Pre-qualified leads with MEDDPICC scorecard, identified pain points, and conversation transcript — before the first meeting. |
| **Sales Manager** | Consistent lead qualification. Data-driven prioritisation. Reduced wasted meetings with unqualified leads. |

---

## 3. Target Users & Personas

### Persona 1: The Prospect (Primary User)

- **Who:** A decision-maker or evaluator at a company considering our enterprise services.
- **Context:** They have discovered our company (via website, referral, ad) and want to learn more before committing to a meeting.
- **Goals:**
  - Understand what services we offer and whether they fit their needs.
  - Get answers to specific technical or business questions.
  - Save relevant information to share with their team.
  - Book a meeting if convinced.
- **Pain Points:**
  - Doesn't want to sit through a generic pitch to get specific answers.
  - Wants to explore on their own terms and timeline.

### Persona 2: The Sales Representative (Indirect User)

- **Who:** The sales rep who will follow up with the prospect.
- **Context:** Receives a qualification brief generated from the AI conversation.
- **Goals:**
  - Walk into the first meeting already knowing the prospect's pain points, decision criteria, timeline, and key stakeholders.
  - Prioritise leads based on qualification score.
- **Interaction with System:** Does NOT interact with the chatbot directly. Receives outputs (qualification brief, MEDDPICC scorecard, conversation summary).

### Persona 3: Sales Manager (Future Phase)

- **Who:** Oversees the sales pipeline.
- **Goals:** Dashboard view of all leads, qualification scores, and pipeline analytics.
- **Interaction with System:** Phase 2/3 — analytics dashboard. Out of scope for MVP.

---

## 4. User Journey

### Prospect Journey (Step-by-Step)

```
1. ARRIVAL
   Prospect visits the AI Sales Assistant page.
   - Entry points: website CTA, direct link, email campaign link.

2. GREETING
   The AI initiates conversation with a warm, non-generic greeting.
   - Asks an open-ended question to understand why they're here.
   - Example: "Welcome! I'm here to help you explore how we can support
     your business. What's driving your interest in our services today?"

3. CONVERSATION
   Natural back-and-forth dialogue:
   - Prospect asks questions → AI retrieves answers from knowledge base (RAG).
   - AI weaves in MEDDPICC qualifying questions at natural points.
   - Dashboard (left pane) updates in real-time:
     → Summary cards of topics discussed
     → Relevant resource links (docs, case studies)
     → Saved Q&A pairs the prospect can bookmark

4. QUALIFICATION THRESHOLD
   Once the AI has gathered sufficient MEDDPICC signals:
   - A "Book a Meeting" CTA becomes prominent on the dashboard.
   - AI may suggest: "Based on what you've shared, I think a conversation
     with our team would be really valuable. Would you like to schedule one?"

5. MEETING BOOKING
   Prospect books a meeting (Calendly embed or similar).
   - They receive a confirmation with a summary of their conversation.

6. SALES HANDOFF
   The system generates a Qualification Brief:
   - MEDDPICC scorecard with extracted signals.
   - Conversation summary with key pain points.
   - Resources the prospect viewed/saved.
   - Recommended talking points for the sales rep.
```

---

## 5. System Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js + CopilotKit)             │
│  ┌──────────────────────┬──────────────────────────────────────┐   │
│  │   Dashboard (Left)   │            Chat (Right)              │   │
│  │   - Session Summary  │   - Conversational AI Interface      │   │
│  │   - Resource Links   │   - Message Input                    │   │
│  │   - Saved Q&A        │   - Typing Indicators                │   │
│  │   - MEDDPICC Progress│   - Message History                  │   │
│  │   - Book Meeting CTA │                                      │   │
│  └──────────────────────┴──────────────────────────────────────┘   │
│                              │                                     │
│                    CopilotKit Runtime (CoAgents)                   │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   BACKEND (Python — LangGraph)                       │
│                                                                      │
│   ┌─────────────────────────────────────────────-─┐                  │
│   │             SUPERVISOR AGENT                  │                  │
│   │  - Orchestrates conversation flow             │                  │
│   │  - Manages agent state (LangGraph State)      │                  │
│   │  - Decides which sub-agents to invoke         │                  │
│   │  - Composes final response to prospect        │                  │
│   │  - Tracks MEDDPICC qualification progress     │                  │
│   └──────┬──────────────┬────────────────┬───────-┘                  │
│          │              │                │                           │
│   ┌──────▼──────┐ ┌─────▼──────┐  ┌─────▼──────────┐                 │
│   │  RAG Agent  │ │  MEDDPICC  │  │    Auditor     │                 │
│   │             │ │  Qualifier │  │    Agent       │                 │
│   │ - Retrieves │ │            │  │                │                 │
│   │   product   │ │ - Extracts │  │ - Spam/Abuse   │                 │
│   │   knowledge │ │   signals  │  │   Detection    │                 │
│   │ - Returns   │ │ - Scores   │  │ - Factual      │                 │
│   │   relevant  │ │   lead     │  │   Grounding    │                 │
│   │   context   │ │ - Suggests │  │   Check        │                 │
│   │             │ │   next Qs  │  │ - Runs in      │                 │
│   └──────┬──────┘ └────────────┘  │   PARALLEL     │                 │
│          │                        └────────────────┘                 │
│   ┌──────▼──────┐                                                    │
│   │ Vector Store│                                                    │
│   │ (ChromaDB)  │                                                    │
│   └─────────────┘                                                    │
│                                                                      │
│   ┌─────────────────────┐                                            │
│   │  Research Agent     │  ← Phase 2 (Async, Post-Conversation)      │
│   │  - Website scraping │                                            │
│   │  - News lookup      │                                            │
│   │  - Company intel    │                                            │
│   └─────────────────────┘                                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo vs. Polyrepo | **Monorepo** (`universal-onboarding-mono`) | Simplifies development during prototype phase. Frontend and backend co-located. |
| Frontend Framework | **Next.js** | CopilotKit has first-class Next.js integration. SSR support. |
| Agentic UI Library | **CopilotKit (CoAgents)** | Enables the dashboard to reactively update based on agent state. Not a traditional chatbot — the UI is agent-driven. |
| Agent Orchestration | **LangGraph (Python)** | Native support for supervisor/sub-agent patterns, state management, and conditional routing. Integrates with CopilotKit via CoAgents protocol. |
| LLM Abstraction | **LangChain** | Provides a unified interface to swap between locally hosted models (Ollama), AWS Bedrock, and OpenAI without code changes. |
| LLM (Prototype) | **Locally hosted** via Ollama | Qwen 3 for reasoning/supervisor. Gemma 3 for conversation generation. Swappable via LangChain. |
| Embedding Model | **Nomic Embed Text v1.5** (locally hosted) | Already downloaded. Open-source, performant, supports variable-length embeddings (Matryoshka). |
| Vector Store (Prototype) | **ChromaDB** | Zero-config, runs locally, Python-native. Adequate for prototype. |
| Vector Store (Production) | **Qdrant** (planned) | Scalable, performant, supports filtering. Migration path from ChromaDB is straightforward. |
| Auditor Placement | **Parallel (Option B)** | Input auditor runs in parallel with supervisor to minimise latency. Output auditor runs inline before final response delivery. |

---

## 6. Agent Design

### 6.1 Supervisor Agent

**Role:** The central orchestrator. Manages conversation state, routes to sub-agents, composes the final response, and drives the MEDDPICC qualification flow.

**LLM:** Qwen 3 (thinking/reasoning model) — locally hosted via Ollama.

**Responsibilities:**
- Receive the prospect's message (after auditor clears it).
- Determine intent: Is the prospect asking a product question? Sharing information about their company? Making small talk?
- Route to the appropriate sub-agent(s):
  - Product question → RAG Agent
  - Prospect sharing context → MEDDPICC Qualifier (to extract signals)
  - Both can be invoked in the same turn.
- Track MEDDPICC state: know which elements have been captured and which are missing.
- Decide when to naturally introduce a qualifying question (not every turn — only when conversationally appropriate).
- Compose the final response by combining RAG context + qualification awareness + conversational tone.
- Update the CopilotKit shared state (dashboard data).

**State Schema (LangGraph):**

```python
from typing import TypedDict, Annotated, Optional
from langgraph.graph.message import add_messages

class ConversationState(TypedDict):
    # Core conversation
    messages: Annotated[list, add_messages]
    session_id: str
    prospect_name: Optional[str]

    # MEDDPICC tracking
    meddpicc: dict  # See Section 8 for schema

    # Dashboard state (synced to CopilotKit)
    summary_cards: list[dict]        # Key topics discussed
    resource_links: list[dict]       # Relevant docs surfaced
    saved_qa_pairs: list[dict]       # Prospect-bookmarked Q&A
    qualification_score: float       # 0.0 to 1.0

    # Auditor state
    flagged_messages: list[dict]     # Messages flagged by auditor
    is_blocked: bool                 # If prospect is blocked for abuse

    # RAG context
    last_retrieved_context: list[str]  # Most recent RAG results
```

### 6.2 RAG Agent

**Role:** Retrieves relevant product knowledge to answer the prospect's questions.

**LLM:** Gemma 3 (conversational model) — locally hosted via Ollama.  
*(Note: The RAG Agent uses the LLM to reformulate queries and synthesise answers from retrieved chunks. The embedding model is separate — see Section 7.)*

**Responsibilities:**
- Receive a query from the Supervisor (may be a reformulated version of the prospect's raw message).
- Perform hybrid retrieval against the vector store:
  - Semantic search using Nomic Embed Text v1.5 embeddings.
  - (Future) Keyword search for exact-match terms (product names, features).
- Re-rank retrieved chunks for relevance.
- Synthesise a grounded answer from the retrieved context.
- Return both the answer AND the source references (document name, section) to the Supervisor.

**Inputs:**
- `query: str` — The question to answer.
- `conversation_context: list` — Recent messages for context-aware retrieval.

**Outputs:**
- `answer: str` — The synthesised response.
- `sources: list[dict]` — List of `{document_name, section, chunk_text, relevance_score}`.
- `resource_links: list[dict]` — Formatted links for the dashboard.

### 6.3 MEDDPICC Qualifier Agent

**Role:** Extracts qualification signals from the prospect's messages and maps them to the MEDDPICC framework.

**LLM:** Qwen 3 (reasoning model) — locally hosted via Ollama.  
*(Reasoning model is preferred here because extraction and classification require analytical thinking.)*

**Responsibilities:**
- Analyse the prospect's messages for MEDDPICC signals.
- Extract structured data: what the prospect said, which MEDDPICC element it maps to, confidence level.
- Update the MEDDPICC state in the conversation.
- Suggest the next best qualifying question for the Supervisor to weave into conversation.

**Inputs:**
- `message: str` — The prospect's latest message.
- `conversation_history: list` — Full conversation for context.
- `current_meddpicc: dict` — Current MEDDPICC state (so it knows what's missing).

**Outputs:**
- `extracted_signals: list[dict]` — New signals extracted, each with `{element, signal_text, confidence, source_quote}`.
- `updated_meddpicc: dict` — Updated MEDDPICC state.
- `suggested_question: Optional[str]` — Next qualifying question to ask (Supervisor decides whether/when to use it).

### 6.4 Auditor Agent

**Role:** Monitors the conversation for security, quality, and factual integrity.

**Execution Model:** Runs in **parallel** with the Supervisor (Option B).

**LLM:** Qwen 3 or a lighter model — locally hosted via Ollama.  
*(Can use a smaller/faster model since tasks are classification-oriented.)*

**Two-Stage Audit:**

#### Stage 1: Input Audit (Parallel with Supervisor)

Runs simultaneously when a prospect message arrives. Checks:

| Check | Description | Action on Failure |
|---|---|---|
| **Spam Detection** | Repeated messages, gibberish, excessive length | Block message, notify Supervisor to respond with a polite redirect |
| **Abuse/Toxicity** | Profanity, threats, harassment | Block message, log incident, optionally end session |
| **Prompt Injection** | Attempts to manipulate the AI (jailbreak, role override) | Block message, log incident, do not forward to Supervisor |
| **Rate Limiting** | Too many messages in a short window | Throttle, ask prospect to slow down |

**Timing:** If the auditor flags the input BEFORE the Supervisor completes its response, the Supervisor's response is discarded and replaced with the auditor's intervention message. If the Supervisor responds first (normal case), the response proceeds to Stage 2.

#### Stage 2: Output Audit (Inline, before delivery)

Runs on the Supervisor's composed response before sending to the prospect. Checks:

| Check | Description | Action on Failure |
|---|---|---|
| **Factual Grounding** | Is the response grounded in retrieved knowledge base content? Does it make claims not supported by the docs? | Flag ungrounded claims. Supervisor regenerates or adds a disclaimer. |
| **Hallucination Detection** | Does the response fabricate product features, pricing, or capabilities? | Block response. Supervisor regenerates. |
| **Tone/Brand Consistency** | Is the response professional, helpful, and on-brand? | Suggest tone adjustments. |
| **Sensitive Information** | Does the response leak internal pricing, competitor analysis, or confidential data? | Block response. Strip sensitive content. |

**Inputs:**
- `message: str` — The message to audit (prospect's input OR AI's output).
- `audit_type: str` — `"input"` or `"output"`.
- `retrieved_context: list[str]` — (For output audit) The RAG context used to generate the response.

**Outputs:**
- `is_safe: bool` — Whether the message passes all checks.
- `flags: list[dict]` — List of `{check_name, severity, reason}` for any failures.
- `intervention_message: Optional[str]` — If blocked, the message to show the prospect.

### 6.5 Research Agent (Phase 2 — Future)

**Role:** Gathers external intelligence about the prospect's company for sales due diligence.

**Execution Model:** Asynchronous. Triggered **after** the conversation ends, NOT during it.

**Responsibilities:**
- Scrape the prospect's company website (if URL provided during conversation).
- Search for recent news, press releases, funding rounds.
- Look up the company on LinkedIn (if accessible).
- Compile a due diligence report for the sales team.

**Output:** Appended to the Qualification Brief (see Section 8).

**Why Phase 2:** This agent involves internet access, web scraping, and external API calls. These add complexity and are not required to validate the core product hypothesis.

---

## 7. Knowledge Base & RAG Pipeline

### 7.1 Data Sources

| Source | Format | Description |
|---|---|---|
| Product Documentation | PDF, Markdown, HTML | Technical and feature documentation for our services. |
| Sales Guides | PDF, DOCX, Markdown | Internal sales playbooks, objection handling, value propositions, competitive positioning. |
| Case Studies | PDF, Markdown | Customer success stories with quantified outcomes. |
| FAQ | Markdown, JSON | Common prospect questions and approved answers. |

### 7.2 Ingestion Pipeline

```
Raw Documents
      │
      ▼
┌──────────────┐
│   Document   │
│   Loader     │  ← LangChain document loaders (PDF, DOCX, MD, HTML)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Chunking   │  ← Recursive Character Text Splitter
│              │     Chunk size: 512 tokens
│              │     Overlap: 64 tokens
│              │     Metadata preserved: source file, section, page number
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Embedding   │  ← Nomic Embed Text v1.5 (locally hosted)
│              │     Dimension: 768 (default) or 256/128 (Matryoshka)
│              │     Prefix: "search_document: " for indexing
│              │            "search_query: " for querying
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  ChromaDB    │  ← Persistent local storage
│  (Vector     │     Collection per document type (products, sales, cases)
│   Store)     │     Metadata filtering supported
└──────────────┘
```

### 7.3 Retrieval Strategy

1. **Query Reformulation:** The Supervisor reformulates the prospect's raw question for better retrieval. Example: "How much does it cost?" → "Pricing and plans for [specific service discussed]".
2. **Semantic Search:** Query embedded with Nomic Embed Text v1.5 using `"search_query: "` prefix. Top-K = 5 chunks retrieved.
3. **Metadata Filtering:** If the conversation has established a specific product/service context, filter retrieval to that collection.
4. **Re-ranking:** (Phase 2) Cross-encoder re-ranking for improved precision.
5. **Context Assembly:** Retrieved chunks assembled with source attribution and passed to the RAG Agent for answer synthesis.

### 7.4 Nomic Embed Text v1.5 — Configuration

- **Model:** `nomic-embed-text:v1.5` (hosted via Ollama)
- **Embedding Dimension:** 768 (full dimension for prototype; consider 256 via Matryoshka for production to reduce storage)
- **Query Prefix:** All queries MUST be prefixed with `search_query: ` 
- **Document Prefix:** All documents MUST be prefixed with `search_document: ` during ingestion
- **Distance Metric:** Cosine similarity

---

## 8. MEDDPICC Qualification Framework

### 8.1 MEDDPICC Elements

| Element | What It Captures | How the AI Extracts It | Example AI Question |
|---|---|---|---|
| **M — Metrics** | Quantifiable measures of success the prospect expects | Prospect mentions ROI, revenue targets, efficiency goals, KPIs | *"What would a successful outcome look like for your team — are there specific metrics you're targeting?"* |
| **E — Economic Buyer** | The person with budget authority | Prospect mentions who approves budget, decision-maker | *"Who else on your team would be involved in evaluating and approving a solution like this?"* |
| **D — Decision Criteria** | What factors the prospect evaluates on | Prospect mentions requirements, must-haves, comparison criteria | *"When evaluating solutions, what are the top priorities for your team?"* |
| **D — Decision Process** | The steps and timeline to a buying decision | Prospect mentions timeline, approval process, stakeholders involved | *"What does the evaluation and decision process typically look like at your organisation?"* |
| **P — Paper Process** | Legal, procurement, and contract process | Prospect mentions procurement, legal review, contract terms | *"Is there a procurement or legal review process we should be aware of for timing purposes?"* |
| **I — Identify Pain** | The business pain driving the need | Prospect describes challenges, frustrations, what triggered the search | *"What's happening in your business right now that brought you here? What challenge are you looking to solve?"* |
| **C — Champion** | An internal advocate within the prospect's company | Prospect indicates they are pushing for this, or names an internal advocate | *"Are you the one leading this initiative internally, or is there a team driving it?"* |
| **C — Competition** | Other vendors or alternatives being evaluated | Prospect mentions competitors, alternative approaches, or DIY | *"Are you looking at other solutions as well, or is this your primary evaluation?"* |

### 8.2 MEDDPICC State Schema

```python
meddpicc_state = {
    "metrics": {
        "status": "not_captured" | "partially_captured" | "captured",
        "signals": [
            {
                "text": "The prospect mentioned targeting 30% reduction in onboarding time",
                "source_quote": "We need to cut our onboarding time by at least 30%",
                "confidence": 0.9,
                "timestamp": "2026-05-25T12:00:00Z"
            }
        ],
        "summary": "Targeting 30% reduction in onboarding time and 20% cost savings."
    },
    "economic_buyer": {
        "status": "not_captured",
        "signals": [],
        "summary": None
    },
    "decision_criteria": { ... },
    "decision_process": { ... },
    "paper_process": { ... },
    "identify_pain": { ... },
    "champion": { ... },
    "competition": { ... }
}
```

### 8.3 Qualification Score Calculation

```
qualification_score = (
    count of elements with status == "captured"
    + 0.5 * count of elements with status == "partially_captured"
) / 8

Range: 0.0 (nothing captured) to 1.0 (fully qualified)
```

**Thresholds:**
- `< 0.3` — Low qualification. AI continues to gather information.
- `0.3 - 0.6` — Moderate qualification. AI may suggest booking a meeting.
- `> 0.6` — High qualification. AI actively encourages meeting booking.

### 8.4 Qualification Brief (Output for Sales)

Generated when the conversation ends or when the prospect books a meeting:

```markdown
# Qualification Brief — [Prospect Name / Company]
**Date:** 2026-05-25
**Session Duration:** 22 minutes
**Qualification Score:** 0.72 / 1.0

## MEDDPICC Scorecard
| Element | Status | Key Signal |
|---|---|---|
| Metrics | ✅ Captured | Targeting 30% reduction in onboarding time |
| Economic Buyer | ⚠️ Partial | "My VP needs to sign off" — VP identified but not named |
| Decision Criteria | ✅ Captured | Integration with Salesforce, sub-1-hour setup |
| Decision Process | ❌ Not Captured | — |
| Paper Process | ❌ Not Captured | — |
| Identify Pain | ✅ Captured | Current onboarding takes 2 weeks, losing deals |
| Champion | ✅ Captured | Prospect is the champion, driving evaluation |
| Competition | ⚠️ Partial | "Looking at a couple of options" — no names |

## Conversation Summary
[AI-generated 3-5 paragraph summary of the key topics discussed]

## Pain Points Identified
1. Onboarding process takes 2 weeks — losing deals in the pipeline.
2. Current tooling doesn't integrate with Salesforce.
3. Team is overwhelmed and needs automation.

## Resources Viewed by Prospect
- Product Overview (viewed, saved)
- Enterprise Onboarding Case Study (viewed)
- Pricing Guide (requested but not yet shared)

## Recommended Talking Points for Sales
1. Lead with the Salesforce integration — it's a top-3 criterion.
2. Share the onboarding ROI calculator.
3. Ask for the VP's name (Economic Buyer gap).
4. Clarify competitive landscape — prospect mentioned "other options."
```

---

## 9. Frontend — UI/UX Specification

### 9.1 Layout

Split-pane layout. No traditional chatbot widget. This is a full-page application.

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: Logo + "AI Sales Assistant" + Session Timer             │
├───────────────────────────┬──────────────────────────────────────┤
│                           │                                      │
│    DASHBOARD (Left)       │          CHAT (Right)                │
│    ~40% width             │          ~60% width                  │
│                           │                                      │
│  ┌─────────────────────┐  │  ┌────────────────────────────-──┐   │
│  │  Session Summary    │  │  │  Message History              │   │
│  │  (auto-updating)    │  │  │  - AI greeting                │   │
│  │  • Topics discussed │  │  │  - User messages              │   │
│  │  • Pain points      │  │  │  - AI responses with          │   │
│  │    identified       │  │  │    inline citations           │   │
│  └─────────────────────┘  │  │  - Typing indicators          │   │
│                           │  │                               │   │
│  ┌─────────────────────┐  │  │                               │   │
│  │  📚 Resources       │  │  │                               │   │
│  │  Context-aware links│  │  │                               │   │
│  │  surfaced by RAG    │  │  │                               │   │
│  │  [Save] button each │  │  │                              │    │
│  └─────────────────────┘  │  └──────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────┐  │  ┌──────────────────────────────┐    │
│  │  💾 Saved Q&A       │  │  │  Input Box                    │   │
│  │  Bookmarked by user │  │  │  [Type your message...]  [➤]  │   │
│  │  Expandable cards   │  │  └──────────────────────────────┘    │
│  └─────────────────────┘  │                                      │
│                           │                                      │
│  ┌─────────────────────┐  │                                      │
│  │  📅 Book a Meeting  │  │                                      │
│  │  [Schedule Now]     │  │                                      │
│  │  (appears when      │  │                                      │
│  │   score > 0.3)      │  │                                      │
│  └─────────────────────┘  │                                      │
│                           │                                      │
├───────────────────────────┴──────────────────────────────────────┤
│  Footer: Powered by [Company] | Privacy Policy                   │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 Dashboard Components (Left Pane)

All dashboard components update **reactively** via CopilotKit's shared state. The agent's state changes trigger UI re-renders automatically.

| Component | Behaviour | Data Source |
|---|---|---|
| **Session Summary** | Auto-updates after each AI response. Shows bullet-point summary of topics discussed and pain points. | `ConversationState.summary_cards` |
| **Resources** | Appears when RAG returns sources. Shows document name + section. "Save" button per resource. | `ConversationState.resource_links` |
| **Saved Q&A** | Prospect can save any Q&A pair from the chat. Expandable cards. | `ConversationState.saved_qa_pairs` |
| **Book a Meeting** | Initially subtle/minimised. Becomes prominent when `qualification_score > 0.3`. | `ConversationState.qualification_score` |

### 9.3 Chat Interface (Right Pane)

- **Not a chat bubble widget.** A full-height conversational interface.
- **Message bubbles:** Differentiated styling for AI vs. prospect messages.
- **Inline citations:** AI responses that reference product docs show clickable citation markers (e.g., `[1]`) that link to the source.
- **Typing indicator:** Shows when the AI is processing.
- **Save button:** Each AI response has a small "Save to Notes" action that adds the Q&A to the dashboard.
- **No message editing.** Prospect cannot edit sent messages.

### 9.4 Responsive Design

- **Desktop (> 1024px):** Side-by-side split pane as designed.
- **Tablet (768–1024px):** Dashboard collapses to a slide-over drawer, triggered by a toggle button.
- **Mobile (< 768px):** Chat is full-screen. Dashboard accessible via a bottom sheet / drawer. Chat remains the primary experience.

---

## 10. Tech Stack

### 10.1 Full Stack Summary

```
┌─────────────────────────────────────────────┐
│  FRONTEND                                   │
│  ├── Next.js (React framework)              │
│  ├── CopilotKit (Agentic UI / CoAgents)     │
│  ├── TypeScript                             │
│  └── CSS (Vanilla or CSS Modules)           │
├─────────────────────────────────────────────┤
│  BACKEND                                    │
│  ├── Python 3.11+                           │
│  ├── LangGraph (Agent orchestration)        │
│  ├── LangChain (LLM abstraction, loaders)   │
│  ├── FastAPI (API layer, if needed)         │
│  └── CopilotKit Python SDK (CoAgents)       │
├─────────────────────────────────────────────┤
│  LLMs (Locally Hosted via Ollama)           │
│  ├── Qwen 3 (Supervisor, MEDDPICC, Auditor) │
│  ├── Gemma 3 (RAG Agent, Conversation)      │
│  └── Nomic Embed Text v1.5 (Embeddings)     │
├─────────────────────────────────────────────┤
│  DATA LAYER                                 │
│  ├── ChromaDB (Vector store — prototype)    │
│  ├── SQLite (Session storage — prototype)   │
│  └── Qdrant (Vector store — production)     │
├─────────────────────────────────────────────┤
│  INFRA (Prototype)                          │
│  ├── mlx (Local LLM hosting)                │
│  ├── Docker / Docker Compose (optional)     │
│  └── localhost                              │
└─────────────────────────────────────────────┘
```

### 10.2 Key Dependencies

**Python (Backend):**

| Package | Version | Purpose |
|---|---|---|
| `langgraph` | latest | Agent orchestration, state management, supervisor pattern |
| `langchain` | latest | LLM abstraction, document loaders, text splitters |
| `langchain-community` | latest | Ollama integration, ChromaDB integration |
| `copilotkit` | latest | CopilotKit Python SDK for CoAgents |
| `chromadb` | latest | Vector store |
| `fastapi` | latest | API layer (if CopilotKit SDK doesn't handle routing) |
| `uvicorn` | latest | ASGI server |
| `pydantic` | v2 | Data validation, state schemas |

**Node.js (Frontend):**

| Package | Version | Purpose |
|---|---|---|
| `next` | latest | React framework |
| `@copilotkit/react-core` | latest | CopilotKit React integration |
| `@copilotkit/react-ui` | latest | CopilotKit UI components |
| `typescript` | latest | Type safety |

---

## 11. Data Flow & Sequence Diagrams

### 11.1 Normal Message Flow (Happy Path)

```
Prospect              Frontend              Supervisor      Auditor       RAG Agent     MEDDPICC
   │                     │                      │              │              │             │
   │  Sends message      │                      │              │              │             │
   │────────────────────>│                      │              │              │             │
   │                     │  Forward message     │              │              │             │
   │                     │─────────────────────>│              │              │             │
   │                     │                      │              │              │             │
   │                     │                      │──── audit ──>│              │             │
   │                     │                      │  (PARALLEL)  │              │             │
   │                     │                      │              │              │             │
   │                     │                      │── query ───────────────────>│             │
   │                     │                      │                             │             │
   │                     │                      │── extract ─────────────--────────────────>│
   │                     │                      │                             │             │
   │                     │                      │<── safe ─────│              │             │
   │                     │                      │<── context ─────────────────│             │
   │                     │                      │<── signals ──────────────--───────────────│
   │                     │                      │              │              │             │
   │                     │                      │  Compose response           │             │
   │                     │                      │              │              │             │
   │                     │                      │──── output audit ──────────>│             │
   │                     │                      │<── safe ─────│              │             │
   │                     │                      │              │              │             │
   │                     │  Response + state    │              │              │             │
   │                     │<─────────────────────│              │              │             │
   │  Display response   │                      │              │              │             │
   │  Update dashboard   │                      │              │              │             │
   │<────────────────────│                      │              │              │             │
```

### 11.2 Flagged Input Flow (Spam/Abuse)

```
Prospect              Frontend              Supervisor      Auditor
   │                     │                      │              │
   │  Sends spam msg     │                      │              │
   │────────────────────>│                      │              │
   │                     │─────────────────────>│              │
   │                     │                      │──── audit ──>│
   │                     │                      │  (PARALLEL)  │
   │                     │                      │── query ────>│ RAG (starts)
   │                     │                      │              │
   │                     │                      │<── FLAGGED ──│
   │                     │                      │              │
   │                     │                      │  DISCARD RAG │
   │                     │                      │  response    │
   │                     │                      │              │
   │                     │  Intervention msg    │              │
   │                     │<─────────────────────│              │
   │  "Please keep the   │                      │              │
   │   conversation      │                      │              │
   │   relevant..."      │                      │              │
   │<────────────────────│                      │              │
```

---

## 12. Security & Guardrails

### 12.1 Prompt Injection Defence

- **System prompts are never exposed** to the prospect. The prospect's messages are treated as untrusted user input at all times.
- **Input sanitisation:** Strip any instruction-like patterns (e.g., "ignore previous instructions", "you are now", "system:") before passing to the LLM.
- The **Auditor Agent** has specific prompt injection detection patterns.
- **LLM output is validated** — if the model produces content that looks like system prompt leakage, the output auditor blocks it.

### 12.2 Data Privacy

- **Prototype:** All data stays local (Ollama, ChromaDB, local filesystem). No data leaves the machine.
- **Production considerations:**
  - Conversation transcripts must be encrypted at rest.
  - Prospect data retention policy must be defined (GDPR compliance if serving EU prospects).
  - Option to anonymise prospect data in qualification briefs.

### 12.3 Rate Limiting

- **Per-session:** Maximum 100 messages per session.
- **Per-minute:** Maximum 10 messages per minute.
- **Session duration:** Maximum 60 minutes. After 45 minutes, the AI suggests booking a meeting.
- Enforced at the **Auditor Agent** level (input audit).

### 12.4 Factual Guardrails

- The AI **must not** fabricate product features, pricing, or capabilities.
- All factual claims must be traceable to a retrieved document chunk.
- If the AI does not have information to answer a question, it must say: *"I don't have the specific details on that, but our team can cover this in a meeting. Would you like to schedule one?"*
- The **Output Auditor** enforces this by checking response claims against retrieved context.

---

## 13. Phased Delivery Plan

### Phase 1 — MVP (Prototype)

**Goal:** A working prototype that demonstrates the core value proposition. Can be demoed to stakeholders and early pilot customers.

**Scope:**

| Component | What's Included | What's Excluded |
|---|---|---|
| **Supervisor Agent** | Full orchestration, state management, response composition | Advanced routing optimisation |
| **RAG Agent** | Semantic search over product docs, answer synthesis with citations | Hybrid search, re-ranking |
| **MEDDPICC Tracking** | Built into Supervisor state. Extraction logic in MEDDPICC qualifier. Score calculation. | Dedicated ML-based extraction model |
| **Auditor Agent** | Input audit (spam, rate limit, basic prompt injection). Output audit (basic factual grounding). | Advanced toxicity models, ML-based hallucination detection |
| **Frontend** | Split-pane UI with CopilotKit. Dashboard: summary, resources, saved Q&A, book meeting. Chat: full conversational interface. | Mobile-optimised layout, analytics views |
| **Knowledge Base** | Ingestion pipeline for product docs + sales guides. ChromaDB storage. | Automated re-ingestion, incremental updates |
| **Qualification Brief** | Generated as markdown/text on session end. | PDF export, CRM integration, email delivery |

**Estimated Effort:** 2–4 weeks (solo developer).

**Deliverables:**
1. Working web application (localhost).
2. At least one product domain's docs ingested into the knowledge base.
3. End-to-end demo: Prospect conversation → Dashboard updates → Qualification brief generated.

---

### Phase 2 — Hardening

**Goal:** Production-readiness. Improved accuracy, security, and the research agent.

**Scope:**

| Component | Addition |
|---|---|
| **Research Agent** | Post-conversation async agent. Scrapes prospect company website, searches for news. Appends to qualification brief. |
| **Auditor Upgrade** | Cross-encoder factual grounding. ML-based toxicity detection. Advanced prompt injection patterns. |
| **RAG Upgrade** | Hybrid search (semantic + keyword). Cross-encoder re-ranking. Multi-collection queries. |
| **Frontend** | Mobile/tablet responsive layout. Session history (prospect can return to past conversations). Polish animations and UX. |
| **Meeting Booking** | Calendly or custom booking integration embedded in dashboard. |
| **Session Persistence** | Conversations saved to database. Prospect can resume sessions. |
| **Deployment** | Dockerised. Deployable to cloud (AWS/GCP). |

**Estimated Effort:** 4–6 weeks.

---

### Phase 3 — Scale & Integrate

**Goal:** Enterprise-ready. Integrations, analytics, multi-tenant.

**Scope:**

| Component | Addition |
|---|---|
| **CRM Integration** | Push qualified leads to Salesforce / HubSpot with MEDDPICC data. |
| **Analytics Dashboard** | Sales manager view: pipeline, qualification scores, conversion rates. |
| **Multi-Product KB** | Support multiple product lines with separate knowledge bases. |
| **Self-Hosted LLMs at Scale** | Qwen 3 / Gemma 3 on dedicated GPU infrastructure or AWS Bedrock. |
| **Multi-Tenant** | Support multiple sales teams / companies with isolated data. |
| **A/B Testing** | Test different qualifying question strategies and measure conversion. |

**Estimated Effort:** 8–12 weeks.

---

## 14. Open Decisions & Assumptions

### Confirmed Decisions

| # | Decision | Choice | Confirmed By |
|---|---|---|---|
| 1 | Primary user | Prospect (end user exploring services) | User |
| 2 | Timing | Pre-meeting (before sales call is booked) | User |
| 3 | Agent framework | LangGraph + LangChain (Python) | User |
| 4 | LLM hosting (prototype) | Locally hosted via Ollama | User |
| 5 | Embedding model | Nomic Embed Text v1.5 (local) | User |
| 6 | LLM swappability | LangChain abstraction for Bedrock / OpenAI swap | User |
| 7 | Auditor placement | Option B — parallel input audit, inline output audit | User |
| 8 | Frontend | CopilotKit + Next.js | User |
| 9 | Architecture | Supervisor + sub-agents (RAG, MEDDPICC, Auditor) | User |
| 10 | Research Agent | Phase 2, async post-conversation | User |

### Assumptions (To Be Validated)

| # | Assumption | Risk if Wrong | Mitigation |
|---|---|---|---|
| 1 | Qwen 3 and Gemma 3 can run on the development machine with acceptable latency. | Prototype is unusable if models are too slow. | Fall back to smaller model variants (e.g., Qwen 3 4B, Gemma 3 4B) or use API-based models temporarily. |
| 2 | CopilotKit's CoAgents protocol integrates smoothly with LangGraph. | Integration issues could block frontend-backend connection. | CopilotKit has official LangGraph integration. Fall back to custom WebSocket/SSE if needed. |
| 3 | Product documentation is sufficient to answer most prospect questions. | RAG returns poor results → bad user experience. | Identify gaps early during ingestion. Add an FAQ collection curated by the sales team. |
| 4 | Prospects will engage with a chatbot meaningfully (vs. bouncing). | The product doesn't get enough data to qualify leads. | Keep the first interaction low-friction. Don't ask qualifying questions too early. |
| 5 | Nomic Embed Text v1.5 provides sufficient retrieval quality for the domain. | Poor retrieval → irrelevant answers. | Benchmark retrieval quality during ingestion. Consider fine-tuning or switching to a larger embedding model. |

### Open Questions (Not Yet Decided)

| # | Question | Impact | Default if Unresolved |
|---|---|---|---|
| 1 | Should the prospect identify themselves (name, company, email) at the start, or is the conversation anonymous until meeting booking? | Affects personalisation and qualification brief completeness. | AI can naturally ask for name during conversation. |
| 2 | What is the meeting booking mechanism? (Calendly embed, custom form, link redirect) | Affects frontend scope. | Simple link redirect to existing booking page in MVP. |
| 3 | Should conversation sessions be persistent (prospect can return later) or ephemeral? | Affects data storage design. | Persistent in Phase 1. |
| 4 | How will the qualification brief be delivered to the sales rep? (Email, dashboard, CRM) | Affects integration scope. | Downloadable markdown file in Phase 1. |

---

## 15. Glossary

| Term | Definition |
|---|---|
| **MEDDPICC** | A B2B sales qualification framework: Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, Competition. |
| **Supervisor Agent** | The central LangGraph agent that orchestrates all sub-agents and manages conversation state. |
| **RAG (Retrieval-Augmented Generation)** | A pattern where the LLM's response is grounded in retrieved documents from a knowledge base, reducing hallucination. |
| **CopilotKit** | An open-source framework for building agentic UIs — where the frontend reacts to AI agent state changes in real-time. |
| **CoAgents** | CopilotKit's protocol for connecting LangGraph agents to the frontend, enabling shared state between agents and UI components. |
| **LangGraph** | A framework by LangChain for building stateful, multi-agent applications with graph-based orchestration. |
| **Nomic Embed Text v1.5** | An open-source text embedding model that supports Matryoshka dimensionality reduction and task-specific prefixes. |
| **ChromaDB** | An open-source, lightweight vector database designed for AI applications. Runs locally with zero configuration. |
| **Qualification Brief** | A structured document generated from the AI conversation summarising the prospect's needs, MEDDPICC signals, and recommended sales actions. |
| **Matryoshka Embedding** | A technique where embeddings can be truncated to smaller dimensions while retaining most of their quality. Supported by Nomic Embed Text v1.5. |
| **Prospect** | A potential customer who is exploring the company's services and interacting with the AI Sales Assistant. |
| **Option B (Auditor)** | The chosen architecture where the input auditor runs in parallel with the supervisor to minimise latency, and the output auditor runs inline before response delivery. |
