I am building a sales agent that should not only answer the user questions but also gather enough information for the human call. I am trying MEDDIC technique for the agent overall. 



I have one rag pipeline built to get the product related information. I have parsed Getting Started documents and various topics from our API documentation. I have also Business Case studies and pricing information into another embedding table.



How should now I design the agent. Thought process: RAG answers the question but it leaves lot of information out but at the same time that lot of information will fill in the context. Also I am thinking to keep two RAG pipelines seperate so that Agent can decide to say use RAG for product information but complete document for the business conversation.


You're thinking about the right problem. Most RAG-based sales agents fail because they are optimized for **answering questions**, while sales discovery is about **reducing uncertainty before a human conversation**.

MEDDIC is actually a state collection framework, not a retrieval framework.

## Separate the concerns

I would design the system around three distinct capabilities:

### 1. Product Knowledge Agent

Purpose: Answer technical and product questions accurately.

Sources:

* API docs
* Getting Started guides
* Product documentation
* Release notes
* Architecture documents

This is your traditional RAG system.

Questions:

* Does your API support OAuth?
* How do webhooks work?
* What's the rate limit?
* Can it integrate with Salesforce?

This agent optimizes for factual accuracy.

---

### 2. Business Discovery Agent

Purpose: Collect MEDDIC information.

Sources:

* Case studies
* Pricing
* Customer stories
* Industry-specific value propositions
* Objection handling
* Competitive positioning

This agent optimizes for uncovering:

| MEDDIC Area       | Example Information             |
| ----------------- | ------------------------------- |
| Metrics           | Expected ROI, cost savings      |
| Economic Buyer    | Decision maker                  |
| Decision Criteria | Security, pricing, integrations |
| Decision Process  | Procurement process             |
| Identify Pain     | Current challenges              |
| Champion          | Internal advocate               |

Instead of simply answering:

> "Can you integrate with SAP?"

It should answer and continue discovery:

> "Yes, we have customers integrating with SAP. Are you primarily looking to automate data synchronization, reporting, or order processing?"

The follow-up question is often more valuable than the answer.

---

### 3. Qualification Memory Agent

This is the most important piece.

Create a structured prospect profile:

```json
{
  "company": "...",
  "industry": "...",
  "employees": 500,
  "metrics": {
    "current_cost": "...",
    "target_savings": "..."
  },
  "pain_points": [],
  "decision_criteria": [],
  "decision_process": {},
  "economic_buyer": {},
  "champion": {},
  "timeline": "...",
  "budget": "..."
}
```

Every conversation updates this profile.

The goal of the agent is not:

> Answer all questions.

The goal is:

> Fill in the qualification profile.

---

# I would NOT retrieve complete documents

This is where many implementations go wrong.

You mentioned:

> Agent can decide to use RAG for product information but complete document for the business conversation.

I would avoid feeding entire case studies into context.

Instead create multiple retrieval layers.

## Layer 1: Semantic chunks

For answering questions.

Example:

```text
OAuth support
Rate limits
Webhook retries
```

---

## Layer 2: Business signals

Extract structured metadata from case studies.

Instead of:

```text
Case Study PDF
```

Store:

```json
{
  "industry": "Manufacturing",
  "company_size": "1000+",
  "pain": "Manual reporting",
  "outcome": "40% reduction in processing time",
  "time_to_value": "3 months"
}
```

Now retrieval becomes:

> Find manufacturing customers with reporting problems.

instead of:

> Find chunks mentioning reporting.

This is dramatically more useful for sales.

---

# Build an Agent Planner

I would have a planner decide which retrieval strategy to use.

```text
User Question
      |
      V
Planner
      |
      +---- Product Knowledge RAG
      |
      +---- Business Discovery RAG
      |
      +---- Qualification Memory
```

Example:

User:

> How much does your platform cost?

Planner:

1. Retrieve pricing
2. Check MEDDIC profile
3. Notice company size unknown
4. Answer pricing question
5. Ask qualification question

Response:

> Pricing is typically based on usage and deployment requirements. For similar organizations we've seen annual contracts ranging from X to Y.
>
> To give a more accurate estimate, approximately how many users or transactions are you expecting?

Notice:

* Question answered
* Discovery progressed

---

# Add a Conversation Strategy Layer

Most sales agents become FAQ bots.

Create an explicit strategy engine.

At every turn:

```json
{
  "answered_user_question": true,
  "confidence": 0.94,
  "missing_meddic_fields": [
    "metrics",
    "economic_buyer",
    "timeline"
  ],
  "best_followup_question": "What timeline are you working toward?"
}
```

Then require the agent to:

1. Answer first
2. Ask one discovery question
3. Update qualification profile

This creates natural progression.

---

# Knowledge Architecture I would use

Keep three separate stores.

### Product Knowledge

```sql
product_chunks
```

Contains:

* API docs
* Guides
* Technical docs

---

### Business Knowledge

```sql
business_chunks
```

Contains:

* Pricing
* Competitive positioning
* Sales collateral
* Case studies

---

### Prospect Memory

```sql
prospect_profiles
prospect_events
```

Contains:

* MEDDIC state
* Extracted facts
* Conversation history
* Qualification score

---

# A more advanced pattern

For case studies, don't just chunk them.

Generate a structured "success pattern" table.

```sql
success_patterns
```

Example:

| Industry   | Pain             | Solution        | Outcome              |
| ---------- | ---------------- | --------------- | -------------------- |
| Retail     | Manual inventory | API integration | 30% reduction        |
| Healthcare | Data silos       | Automation      | 50% faster reporting |

When the prospect says:

> We're struggling with inventory synchronization.

The agent can retrieve patterns directly rather than searching paragraphs.

This usually performs much better than vector search over PDFs.

---

The architecture I would choose is:

```text
                    User
                      |
                      V
               Sales Agent
                      |
             Planner / Router
                      |
       +--------------+--------------+
       |                             |
       V                             V
 Product Knowledge RAG      Business Knowledge RAG
       |                             |
       +--------------+--------------+
                      |
                      V
           MEDDIC State Manager
                      |
                      V
         Qualification Profile
                      |
                      V
         Human Handoff Summary
```

The key shift is that MEDDIC should live as **structured state that the agent is trying to complete**, not as information hidden inside retrieval chunks. RAG answers questions; the qualification engine drives the conversation toward collecting the information the sales team needs.

What you have today is actually a good **document retrieval architecture**, but not yet a **sales reasoning architecture**.

Your current design:

```json
{
  "meddic_category": "objection_handling",
  "text": "...",
  "embedding": [...]
}
```

works well when somebody asks:

> How do you handle implementation objections?

The vector search finds the relevant chunk.

The problem appears when the agent needs to reason:

> Prospect is a fintech with 5M annual card volume, worried about implementation time, evaluating us against Marqeta, wants launch in 3 months.

Now the agent should retrieve:

* Similar fintech success stories
* Typical launch timelines
* Implementation objections
* Competitive differentiation against Marqeta
* Industry benchmarks

This is not a semantic search problem anymore. It is a **sales intelligence problem**.

---

# What I would keep

Keep your current embeddings.

```sql
business_knowledge
(
    id,
    category,
    text,
    embedding,
    source_document
)
```

This remains valuable.

---

# What I would add

Generate structured business entities from those documents.

Think of this as a second layer.

## Example 1: Success Stories

Instead of storing only:

```text
ABC Bank launched a prepaid card program.
Reached 200,000 users in 12 months.
Reduced acquisition costs by 30%.
Integrated in 14 weeks.
```

Generate:

```json
{
  "entity_type": "success_story",
  "company": "ABC Bank",
  "industry": "Banking",
  "region": "APAC",
  "program_type": "Prepaid Card",
  "customer_size": "Enterprise",

  "pain_points": [
    "high acquisition costs"
  ],

  "implementation_duration_weeks": 14,

  "outcomes": [
    {
      "metric": "users",
      "value": 200000
    },
    {
      "metric": "acquisition_cost_reduction",
      "value": "30%"
    }
  ]
}
```

Now the agent can filter:

```sql
WHERE industry = 'Banking'
```

instead of hoping vector search finds the right story.

---

# Example 2: Industry Benchmarks

Current:

```text
Digital banks typically achieve 15-20% activation rates...
```

Convert into:

```json
{
  "entity_type": "industry_benchmark",

  "industry": "Digital Banking",

  "metric": "card_activation_rate",

  "low": 15,
  "high": 20,

  "unit": "percent",

  "source": "Industry Report 2025"
}
```

Now when MEDDIC asks for Metrics:

> What activation rate are you targeting?

Agent can compare prospect data directly.

---

# Example 3: Pricing Models

Current chunk:

```text
Revenue sharing works best for issuers with over 100k cards...
```

Structured:

```json
{
  "entity_type": "pricing_model",

  "pricing_type": "Revenue Share",

  "best_fit": [
    "Issuer",
    "Bank"
  ],

  "minimum_scale": {
    "cards": 100000
  },

  "advantages": [
    "Lower upfront cost"
  ],

  "disadvantages": [
    "Longer payback period"
  ]
}
```

Now the agent can reason:

> Prospect only expects 20k cards.

Revenue share probably not ideal.

---

# Example 4: Competitive Battlecards

Current:

```text
Compared with Marqeta we have stronger issuer processing capabilities...
```

Structured:

```json
{
  "entity_type": "competitor",

  "competitor": "Marqeta",

  "strengths": [
    "Developer experience"
  ],

  "our_advantages": [
    "Issuer processing",
    "Settlement"
  ],

  "objections": [
    {
      "claim": "Marqeta launches faster",
      "response": "Implementation averages are similar"
    }
  ]
}
```

Now retrieval can be:

```sql
WHERE competitor='Marqeta'
```

instead of vector matching.

---

# Example 5: Objection Handling

This is where most sales agents become powerful.

Current:

```text
Prospects often worry about implementation effort...
```

Structured:

```json
{
  "entity_type": "objection",

  "objection_type": "implementation",

  "buyer_persona": "Product Manager",

  "stage": "evaluation",

  "response_strategy": [
    "share timeline examples",
    "show implementation guide"
  ],

  "supporting_assets": [
    "success_story_123",
    "timeline_doc_456"
  ]
}
```

Now when the prospect says:

> I'm worried this project could take 9 months.

The agent can:

1. Detect objection
2. Retrieve objection strategy
3. Retrieve matching success stories
4. Retrieve implementation timelines

---

# My Preferred Architecture

I would have three stores.

## Store 1: Product RAG

```sql
product_chunks
```

Purpose:

* Technical Q&A

---

## Store 2: Business RAG

```sql
business_chunks
```

Purpose:

* Sales collateral
* Long-form retrieval

This is what you already have.

---

## Store 3: Sales Intelligence Graph

```sql
success_stories
industry_benchmarks
pricing_models
competitive_positioning
objections
implementation_patterns
```

These are structured tables.

---

# The Ingestion Pipeline

When a PDF arrives:

```text
PDF
 |
 +--> Chunking
 |      |
 |      +--> business_chunks
 |
 +--> LLM Extraction
        |
        +--> structured entities
```

Example:

```text
05_competitive_battlecards.pdf

          |
          +--> embeddings
          |
          +--> competitors table
          |
          +--> objection table
```

One document generates many records.

---

# The Agent Retrieval Flow

When user asks:

> We currently use Marqeta and need to launch in 4 months. Is that realistic?

The agent should not do one vector search.

Instead:

```text
1. Detect competitor = Marqeta

2. Detect timeline concern

3. Retrieve:
   - competitor data
   - timeline patterns
   - relevant success stories

4. Generate answer

5. Update MEDDIC state
```

This is why I view business information differently from product documentation.

**Product knowledge is usually retrieved as text.**

**Business knowledge is often better retrieved as facts, patterns, benchmarks, objections, and success signals.**

For a MEDDIC sales agent, the highest-value asset is not another embedding table. It is a structured sales intelligence layer that sits beside the embeddings and gives the agent something it can reason over rather than just quote from.










Now you're moving from **knowledge architecture** to **agent architecture**.

At this point you already have:

```text
Product Knowledge
├── product_chunks
│
Business Knowledge
├── business_chunks
├── business_entities
│
Prospect Intelligence
├── prospect_facts
├── prospect_meddic
```

The next challenge is:

> How does the agent decide what to do next?

Most sales agents fail because they do:

```text
User Question
    ↓
RAG Search
    ↓
Answer
```

A good sales agent does:

```text
User Question
    ↓
Understand Intent
    ↓
Update Prospect Intelligence
    ↓
Determine Missing MEDDIC
    ↓
Plan Conversation
    ↓
Retrieve Relevant Knowledge
    ↓
Answer
    ↓
Advance Discovery
```

---

# High-Level Agent Architecture

I would build 5 specialized agents.

```text
                   User
                     │
                     ▼
            Sales Orchestrator
                     │
 ┌───────────────────┼────────────────────┐
 │                   │                    │
 ▼                   ▼                    ▼
Fact Extractor   MEDDIC Manager   Knowledge Planner
                                         │
                               ┌─────────┴─────────┐
                               ▼                   ▼
                      Product RAG Agent   Business Intelligence Agent
                               │
                               ▼
                        Response Composer
```

---

# Agent 1: Fact Extraction Agent

Runs on every message.

Goal:

Extract structured sales facts.

User:

> We currently use Marqeta and process around $40M per month.

Extract:

```json
{
  "current_provider": "Marqeta",
  "monthly_volume": 40000000
}
```

Store:

```sql
prospect_facts
```

---

# Agent 2: MEDDIC State Manager

Maintains:

```json
{
  "metrics": 70,
  "economic_buyer": 20,
  "decision_criteria": 60,
  "decision_process": 10,
  "pain": 90,
  "champion": 0
}
```

This becomes the conversation state.

---

Instead of:

> What question should I ask?

The system asks:

> Which MEDDIC area has the highest value and lowest confidence?

---

Example:

Current state:

```json
{
  "metrics": true,
  "pain": true,
  "economic_buyer": false,
  "champion": false
}
```

Next discovery objective:

```text
Identify Economic Buyer
```

---

# Agent 3: Knowledge Planner

Most important agent.

Input:

```json
{
  "user_question": "...",
  "prospect_state": "...",
  "missing_meddic": [...]
}
```

Output:

```json
{
  "needs_product_rag": true,
  "needs_business_entities": true,
  "needs_discovery_question": true,
  "entity_types": [
    "competitive_position",
    "success_story"
  ]
}
```

---

Example

User:

> How are you different from Marqeta?

Planner:

```json
{
  "retrieve": [
    "competitive_position",
    "success_story"
  ],
  "followup_goal": "Decision Criteria"
}
```

---

# Agent 4A: Product Knowledge Agent

Uses:

```sql
product_chunks
```

Answers:

* API
* integrations
* webhooks
* compliance
* onboarding

No MEDDIC logic.

Pure factual retrieval.

---

# Agent 4B: Business Intelligence Agent

Uses:

```sql
business_entities
business_chunks
```

Retrieves:

```text
pain_pattern
industry_benchmark
success_story
competitive_position
objection
timeline_pattern
pricing_model
```

This becomes the sales brain.

---

Example:

Prospect:

> Implementation timelines are a concern.

Retrieve:

```text
timeline_pattern
success_story
objection
```

---

# Agent 5: Response Composer

Produces final response.

Template:

```text
1. Answer question
2. Add relevant benchmark/story
3. Ask discovery question
```

Example:

> Similar OTA customers typically complete implementation in 8–12 weeks. One enterprise OTA reduced reconciliation effort significantly using single-use virtual cards.
>
> Out of curiosity, what timeline are you targeting for launch?

---

# Add a MEDDIC Opportunity Score

Continuously calculate:

```json
{
  "overall_score": 67,

  "metrics": 90,
  "economic_buyer": 20,
  "decision_criteria": 80,
  "decision_process": 30,
  "pain": 95,
  "champion": 10
}
```

This drives strategy.

---

# Discovery Planner

Very advanced but extremely useful.

Create:

```sql
sales_playbooks
```

Example:

```json
{
  "trigger": {
    "industry": "OTA"
  },

  "priority_questions": [
    "supplier payment volume",
    "reconciliation effort",
    "virtual card usage"
  ]
}
```

Planner consults playbook.

---

# Interaction Flow Example

### Message 1

User:

> We run an OTA in APAC.

Fact Extraction:

```json
{
  "industry": "OTA"
}
```

MEDDIC:

```json
{
  "pain": 0,
  "metrics": 0
}
```

Planner:

Retrieve:

```text
industry_use_case
```

Response:

> Many OTAs use virtual cards to simplify supplier payments.
>
> How are you currently paying hotels and airlines today?

---

### Message 2

User:

> Mostly bank transfers.

Fact Extraction:

```json
{
  "payment_method": "bank_transfer"
}
```

Retrieve:

```text
pain_pattern
```

Response:

> That's a common model. Many OTAs experience reconciliation challenges with aggregated supplier payments.
>
> How much effort does your finance team spend reconciling bookings against supplier payouts?

---

### Message 3

User:

> Probably two people almost full-time.

Fact Extraction:

```json
{
  "reconciliation_fte": 2
}
```

MEDDIC:

```json
{
  "pain": 85
}
```

Retrieve:

```text
industry_benchmark
success_story
```

Response:

> Similar OTAs often automate most of that effort through single-use virtual cards and achieve near real-time reconciliation.
>
> Roughly what monthly supplier payment volume are you processing?

---

Notice what happened:

The conversation naturally progresses through MEDDIC without feeling like a questionnaire.

---

# Human Handoff Generator

At any time the sales rep should see:

```json
{
  "company": "TravelCo",

  "industry": "OTA",

  "pain_points": [
    "manual reconciliation"
  ],

  "current_solution": [
    "bank transfers"
  ],

  "monthly_volume": "$40M"
}
```

And:

```json
{
  "metrics": {
    "confidence": 90
  },

  "economic_buyer": {
    "confidence": 10
  },

  "decision_process": {
    "confidence": 20
  }
}
```

Along with:

```text
Suggested next call agenda:

1. Identify economic buyer
2. Discuss interchange opportunity
3. Review implementation timeline
```

---

The biggest design change I'd make is:

**Don't think of the Sales Agent as a RAG agent.**

Think of it as a **Prospect Intelligence System** whose primary job is:

1. Build a structured MEDDIC profile.
2. Identify gaps.
3. Retrieve the right business intelligence.
4. Move the conversation toward qualification.
5. Produce a high-quality handoff for a human AE.

The RAG systems become supporting tools, not the center of the architecture.
