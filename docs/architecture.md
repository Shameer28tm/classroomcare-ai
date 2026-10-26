# ClassroomCare AI × NIU: Architecture Blueprint

## 1. System Overview

**ClassroomCare AI — NIU Facilities & Campus Operations** is an enterprise-grade autonomous classroom maintenance management and operational intelligence platform designed specifically for **Noorul Islam Centre for Higher Education (NIU)**, Kumaracoil, Tamil Nadu. It unifies incident reporting, deterministic safety triage, intelligent technician dispatch, equipment lifecycle management, and controllable retrieval-augmented generation (RAG) powered by Gemini and LangGraph.

The core architectural premise is **safety and controllability first**: while generative AI provides high-leverage assistive reasoning, deterministic guardrails strictly govern physical hazard classification, supervisor escalation, and SLA management. An LLM is never permitted to independently downgrade safety classifications, override life-safety protocols, or bypass human authorization.

```
                           +-----------------------------------+
                           |     React 18 + Vite Frontend      |
                           |  Vanilla CSS Tokens (design-tokens)|
                           |  (Professional Light Mode UI)     |
                           +-----------------+-----------------+
                                             |
                                 REST API & SSE Streams
                                             |
                                             v
                           +-----------------------------------+
                           |        FastAPI Core Gateway       |
                           |   Auth Middleware + Pydantic v2   |
                           +--------+-----------------+--------+
                                    |                 |
                   +----------------+                 +----------------+
                   |                                                   |
                   v                                                   v
+--------------------------------------+            +--------------------------------------+
|    Deterministic Safety Engine       |            |    Controllable RAG & LangGraph      |
|  - Life-Safety Hazard Rules          |            |  - Multi-Index Hybrid Search (pgvec) |
|  - Automatic EMERGENCY/CRITICAL Lock |            |  - Context Relevance Filter          |
|  - Immediate Switchboard Escalation  |            |  - Fact-Grounding & Verification     |
|  - Strict Zero-LLM-Override Policy   |            |  - Bounded Re-planning & Abstention  |
+------------------+-------------------+            +------------------+-------------------+
                   |                                                   |
                   +----------------+                 +----------------+
                                    |                 |
                                    v                 v
                           +-----------------------------------+
                           |     Supabase / PostgreSQL 16      |
                           |  - pgvector Embeddings (768 Dim)  |
                           |  - Row Level Security (RLS)       |
                           |  - Full-Text Search (tsvector)    |
                           |  - Immutable Audit & Event Logs   |
                           +-----------------------------------+
```

---

## 2. Monorepo Topology

The application is structured as a modular monorepo to ensure clean separation of concerns, high testability, and isolated deployment lifecycles:

```
classroomcare-app/
├── apps/
│   └── web/                                # Frontend Application
│       ├── src/
│       │   ├── components/                 # Reusable UI component library (shadcn/ui style)
│       │   │   ├── ui/                     # Primitives (button, card, dialog, badge, input, etc.)
│       │   │   ├── layout/                 # Sidebar, AppHeader, PageContainer, Breadcrumbs
│       │   │   └── common/                 # State guards (EmptyState, ErrorBoundary, LoadingSkeleton)
│       │   ├── pages/                      # 10 Enterprise Operational Pages
│       │   │   ├── Overview/               # Executive dashboard, real-time KPI tiles, alerts
│       │   │   ├── Tickets/                # Request queue, filters, detail drawer, lifecycle
│       │   │   ├── AgentActivity/          # LangGraph decision logs, traces, safety overrides
│       │   │   ├── KnowledgeBase/          # Manuals, SOPs, RAG search & interactive assistant
│       │   │   ├── TechnicianWorkspace/    # Tech workbench, assigned queue, repair checklist
│       │   │   ├── Facilities/             # Buildings, classrooms, asset inventory hierarchy
│       │   │   ├── SlaMonitoring/          # SLA countdowns, breach risks, escalation matrix
│       │   │   ├── Analytics/              # MTTR, root cause frequency, cost & failure trends
│       │   │   ├── Notifications/          # Real-time incident alerts, safety broadcasts
│       │   │   └── Admin/                  # RBAC user management, roles, immutable audit logs
│       │   ├── services/                   # API clients, Supabase client, query hooks
│       │   ├── types/                      # TypeScript domain models and contracts
│       │   ├── lib/                        # Formatting, date utils, color tokens, constants
│       │   ├── index.css                   # Global styles & design system CSS variables
│       │   ├── App.tsx                     # Main Router configuration
│       │   └── main.tsx                    # Vite entrypoint
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── tsconfig.json
├── services/
│   └── api/                                # Backend Application
│       ├── app/
│       │   ├── api/                        # Route endpoints
│       │   │   ├── v1/
│       │   │   │   ├── tickets.py          # Ticket CRUD, triage, status transitions
│       │   │   │   ├── agent.py            # LangGraph execution triggers and streaming logs
│       │   │   │   ├── knowledge.py        # Document upload, chunking, retrieval endpoints
│       │   │   │   ├── facilities.py       # Buildings, rooms, assets management
│       │   │   │   ├── sla.py              # SLA tracking, policy rules, escalations
│       │   │   │   ├── analytics.py        # Aggregated operational metrics
│       │   │   │   └── audit.py            # Immutable system audit trails
│       │   ├── core/                       # Core configuration, security, database
│       │   │   ├── config.py               # Pydantic BaseSettings with env validation
│       │   │   ├── database.py             # Supabase / Async SQLAlchemy connection pool
│       │   │   ├── security.py             # JWT verification, RBAC permissions check
│       │   │   └── safety_rules.py         # Deterministic safety rule matrix
│       │   ├── rag/                        # RAG ingestion and retrieval subsystem
│       │   │   ├── chunker.py              # Semantic text chunking with metadata enrichment
│       │   │   ├── embeddings.py           # Provider-agnostic embedding interface (Gemini / Mock)
│       │   │   ├── hybrid_retriever.py     # Hybrid pgvector cosine + tsvector keyword retriever
│       │   │   └── relevance_filter.py     # Context distillation and noise reduction filter
│       │   ├── agent/                      # LangGraph Autonomous Agent
│       │   │   ├── state.py                # TypedDict AgentState schema
│       │   │   ├── graph.py                # StateGraph orchestration & conditional edges
│       │   │   ├── nodes.py                # Discrete execution nodes (planner, retriever, evaluator)
│       │   │   ├── guardrails.py           # Grounding verification & policy assertion
│       │   │   └── tools.py                # Whitelisted tool registry with strict permission bounds
│       │   ├── models/                     # Pydantic schemas (Domain, Request, Response)
│       │   └── main.py                     # FastAPI application factory
│       ├── tests/                          # Backend test suite (pytest, pytest-asyncio)
│       │   ├── unit/                       # Unit tests for safety rules, chunker, grounding
│       │   └── integration/                # Integration tests for API endpoints & agent flow
│       ├── requirements.txt
│       └── pytest.ini
├── supabase/
│   └── migrations/                         # Declarative SQL migrations
│       ├── 20261026000001_initial_schema.sql
│       ├── 20261026000002_pgvector_setup.sql
│       ├── 20261026000003_rls_policies.sql
│       └── 20261026000004_seed_data.sql
├── docs/
│   ├── architecture.md                     # Comprehensive architectural blueprint
│   ├── implementation-audit.md             # Codebase audit, defect log & remediation status
│   ├── niu-public-source-inventory.md      # Provenance records from https://www.niuniv.com/
│   ├── supabase-setup-guide.md             # Step-by-step beginner Supabase connection manual
│   ├── api-verification-report.md          # Route audit, schemas, auth, and automated test results
│   ├── rag-verification-report.md          # RAG pipeline evaluation, citations, and injection tests
│   ├── user-guide.md                       # Comprehensive software user manual (Sections A-F)
│   ├── safety-policy-matrix.md             # Deterministic hazard definitions & protocol
│   ├── implementation-plan.md              # Phase-by-phase execution checklist
│   └── verification-report.md              # Authoritative verification results (PASS/FAIL/BLOCKED)
├── scripts/                                # Utility and automation scripts
│   ├── setup_dev.py                        # Dev environment bootstrapping
│   ├── seed_database.py                    # Seed verified NIU facilities & documents
│   └── run_agent_eval.py                   # 10 Critical User Journeys evaluation benchmark
├── .env.example                            # Sanitized environment template
├── .gitignore                              # Git exclusion rules
└── README.md                               # Project documentation & operational quickstart
```

---

## 3. Technology Stack Rationale

| Layer | Selected Technology | Architectural Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite + TypeScript** | Rapid HMR, strict type safety, lean bundle size, modular component hierarchy. |
| **Styling & UI Tokens** | **Tailwind CSS + Custom Design System** | High-density enterprise aesthetics; custom palette inspired by deep navy (`#0B132B`), slate black (`#1C2541`), clean white (`#FFFFFF`), and accent blue (`#48CAE4` / `#0077B6`). |
| **Data Visualization** | **Recharts** | Declarative, SVG-based charting for real-time MTTR, ticket velocity, failure distribution, and SLA countdowns. |
| **Routing** | **React Router v6** | Client-side routing with nested layouts, guarded paths, and URL-synchronized filters. |
| **Backend Framework** | **FastAPI (Python 3.11+)** | High-performance asynchronous execution, native OpenAPI schema generation, strict Pydantic v2 data validation. |
| **Agent Orchestration** | **LangGraph** | Explicit cyclic and conditional state graphs; full control over planning, replanning, verification nodes, and execution telemetry. |
| **Database & Vector Store** | **Supabase (PostgreSQL 16 + pgvector)** | Relational integrity for transactional facility data paired with `pgvector` for semantic document embeddings, unified under single Row-Level Security policies. |
| **LLM & Embeddings** | **Google Gemini (via Provider Abstraction)** | Native multi-modal capability, massive context window, high instruction-following accuracy, encapsulated behind an interface allowing mock testing. |
| **Safety Guardrails** | **Deterministic Python Rules** | Hardware and life-safety compliance requires zero-tolerance determinism; non-negotiable hazards bypass probabilistic LLM judgment entirely. |

---

## 4. Reusable Concepts Extracted from `Controllable-RAG-Agent`

The reference repository (`Controllable-RAG-Agent` by Nir Diamant) demonstrates several critical patterns for reliable agentic RAG that are adapted and expanded for ClassroomCare AI:

```
[Reference: Controllable-RAG-Agent]                   [ClassroomCare AI Production Adaptation]
1. Plan-and-Solve Graph Logic           ----->        Explicit LangGraph state machine with discrete nodes
2. Multi-Store Retrieval               ----->        Hybrid pgvector (Semantic) + PostgreSQL tsvector (Keyword)
3. Noise Distillation Chain            ----->        `relevance_filter`: Trims irrelevant manual sections
4. Fact Grounding Checks               ----->        Strict grounding check against OEM manuals & past tickets
5. Bounded Replanning Loop             ----->        Max 2 replan attempts before deterministic abstention
6. LLM-only Safety Classification     -(REPLACED)-> Deterministic Hard Guardrails (LLM cannot downgrade risk)
```

### Detailed Extraction & Improvements:

1. **Explicit State Graph**:
   - *Reference*: Implements a graph that decomposes queries into sub-tasks, queries vector stores, evaluates if an answer can be synthesized, and replans if context is lacking.
   - *ClassroomCare Adaptation*: We implement a dedicated `ClassroomCareState` object in LangGraph with explicit execution tracking, capturing `safety_passed`, `retrieved_evidence`, `relevance_scores`, `grounding_status`, `proposed_actions`, and `audit_log`.

2. **Multi-Granularity Hybrid Retrieval**:
   - *Reference*: Queries 3 isolated FAISS indices (chunks, chapter summaries, quotes).
   - *ClassroomCare Adaptation*: We use Supabase PostgreSQL with `pgvector` and `tsvector` to execute **Hybrid RRF (Reciprocal Rank Fusion)** across:
     - Operational Equipment Manuals (fine-grained chunks)
     - Historical Incident Playbooks (structured incident/resolution summaries)
     - District Safety Codes & Campus Policies (mandatory regulatory guidelines)

3. **Context Relevance & Grounding Verification**:
   - *Reference*: Uses LLM prompts (`create_keep_only_relevant_content_chain` and `is_answer_grounded_on_context`) to verify retrieved data before final output.
   - *ClassroomCare Adaptation*: We perform a two-stage filter:
     - Stage 1: Document chunks are filtered for topic alignment, stripping non-applicable safety warnings or alternate model specifications.
     - Stage 2: The generated recommendation is validated against cited passage IDs. If a claim lacks citation, the system flags the claim as unverified.

4. **Abstention Protocol**:
   - *Reference*: Halts if evidence cannot answer the query.
   - *ClassroomCare Adaptation*: When confidence is below threshold or evidence is missing, the agent emits an explicit **ABSTAIN** decision: "Insufficient documentation to verify repair procedure. Escalating to Senior Facility Technician for physical diagnostic inspection."

5. **Elimination of Anti-Patterns**:
   - The reference relies on heavy local FAISS pickles, hardcoded OpenAI chains, and lack of RBAC.
   - ClassroomCare replaces these with enterprise PostgreSQL/pgvector, clean Gemini provider abstractions, full mock capabilities for automated CI tests, and strict Row Level Security.

---

## 5. Deterministic Safety Architecture

Physical safety in schools and university campuses is non-negotiable. Standard LLM agents are prone to sycophancy, probabilistic hallucinations, or instruction-drift.

### The Safety Shield Protocol
Before any ticket passes to the LLM or LangGraph agent, it must pass through the **Deterministic Safety Shield**:

```
                       Incoming Maintenance Ticket
                                   |
                                   v
             +-------------------------------------------+
             |       Deterministic Safety Rule Matrix    |
             |   (RegEx, Keyword Sets, Asset Hazard Map) |
             +---------------------+---------------------+
                                   |
                  Matches Safety-Critical Hazard?
                                   |
                 +-----------------+-----------------+
                 | YES                               | NO
                 v                                   v
+---------------------------------+  +---------------------------------+
|  AUTOMATIC CRITICAL / EMERGENCY |  |  Normal Operational Triage     |
|  - Lock priority to CRITICAL    |  |  - Standard Priority Assessment |
|  - Disconnect / Evacuate SOP   |  |  - RAG Manual Retrieval        |
|  - Immediate Supervisor SMS/Push|  |  - LangGraph Optimization Plan |
|  - LLM CANNOT DOWNGRADE         |  +---------------------------------+
+---------------------------------+
```

### Safety Rules Matrix

| Hazard Class | Trigger Patterns | Deterministic Action | Supervisor SLA |
| :--- | :--- | :--- | :--- |
| **Electrical Life Hazard** | `exposed wire`, `sparking`, `electric shock`, `smoke from outlet`, `panel buzzing` | Priority locked to `EMERGENCY`. Auto-dispatch certified electrician. Send alert to campus safety officer. | 15 Minutes |
| **Active Water Inundation** | `burst pipe`, `ceiling collapse water`, `standing water near electric`, `major leak` | Priority locked to `CRITICAL`. Flag main shut-off valve location from building registry. | 30 Minutes |
| **Chemical / Gas Threat** | `gas smell`, `rotten eggs`, `chemical spill`, `fumes in lab`, `co alarm` | Priority locked to `EMERGENCY`. Trigger immediate classroom evacuation protocol. Notify local fire marshals. | Immediate (5m) |
| **Structural / Glass Hazard** | `shattered window`, `falling ceiling tile`, `broken handrail`, `structural crack` | Priority locked to `CRITICAL`. Restrict room access in scheduling system. | 45 Minutes |
| **HVAC Extreme Weather** | `no heat in winter`, `ac failed server room`, `extreme temperature classroom` | Priority locked to `HIGH`. Check environmental compliance thresholds. | 2 Hours |

---

## 6. Database Schema & Data Models

The database is built on PostgreSQL 16 via Supabase, with full relational integrity, foreign key cascades, `pgvector` indexing, and Row Level Security.

```
+--------------------+        +--------------------+        +--------------------+
|     buildings      | 1    N |     classrooms     | 1    N |       assets       |
|--------------------|--------|--------------------|--------|--------------------|
| id (UUID, PK)      |        | id (UUID, PK)      |        | id (UUID, PK)      |
| campus_name        |        | building_id (FK)   |        | classroom_id (FK)  |
| building_name      |        | room_number        |        | asset_name         |
| code               |        | floor              |        | category           |
| emergency_contacts |        | capacity           |        | model_number       |
+--------------------+        | status             |        | serial_number      |
                              +--------------------+        | install_date       |
                                         | 1                | warranty_expiry    |
                                         |                  | status             |
                                         | N                +--------------------+
                              +--------------------+                   | 1
                              | maintenance_tickets|                   |
                              |--------------------|                   |
                              | id (UUID, PK)      |                   |
                              | ticket_number (seq)|                   |
                              | classroom_id (FK)  |                   |
                              | asset_id (FK, opt) |<------------------+
                              | requester_id (FK)  |
                              | assigned_tech (FK) |
                              | category           |
                              | priority           |
                              | status             |
                              | title              |
                              | description        |
                              | is_safety_hazard   |
                              | safety_override    |
                              | sla_response_due   |
                              | sla_resolve_due    |
                              | resolution_notes   |
                              +--------------------+
                                         | 1
                      +------------------+------------------+
                      | N                                   | N
           +--------------------+                +--------------------+
           |   ticket_events    |                |    audit_logs      |
           |--------------------|                |--------------------|
           | id (UUID, PK)      |                | id (UUID, PK)      |
           | ticket_id (FK)     |                | entity_type        |
           | actor_id (FK)      |                | entity_id          |
           | event_type         |                | action             |
           | payload (JSONB)    |                | actor_id           |
           | created_at         |                | diff (JSONB)       |
           +--------------------+                | ip_address         |
                                                 +--------------------+
```

### Knowledge Base & Embeddings Schema:
- **`knowledge_documents`**: Stores parent manual metadata (e.g. `HVAC_Trane_ModelX_Manual.pdf`, version, department, access level).
- **`document_chunks`**: Stores discrete chunks (512 tokens with 64 token overlap), full-text search vector `tsv (tsvector)`, and embedding `embedding (vector(768))`.
- **`agent_runs`**: Stores full LangGraph execution telemetry, input payload, intermediate node states, retrieved citation IDs, and output resolution for auditability.

---

## 7. Controllable LangGraph Workflow

```
[Start Ticket Evaluation]
          │
          ▼
┌───────────────────────────────┐
│   intake_and_sanitize_node   │  Validate payload, parse room, asset, and user intent
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ deterministic_safety_filter  │  Check life-safety keyword/asset rules
└──────────────┬────────────────┘
               │
       Is Safety Critical?
        ├─── YES ──> [Mark Priority=EMERGENCY, Trigger Safety Escalate, Bypass LLM] ──┐
        │                                                                             │
        └─── NO                                                                       │
               │                                                                      │
               ▼                                                                      │
┌───────────────────────────────┐                                                     │
│   decompose_and_plan_node     │  Break complex maintenance ticket into diagnostics   │
└──────────────┬────────────────┘                                                     │
               │                                                                      │
               ▼                                                                      │
┌───────────────────────────────┐                                                     │
│     hybrid_retrieve_node      │  Query pgvector + tsvector for manuals & playbooks  │
└──────────────┬────────────────┘                                                     │
               │                                                                      │
               ▼                                                                      │
┌───────────────────────────────┐                                                     │
│    relevance_filter_node      │  Filter out noisy or irrelevant manual passages     │
└──────────────┬────────────────┘                                                     │
               │                                                                      │
               ▼                                                                      │
┌───────────────────────────────┐                                                     │
│    grounding_evaluator_node   │  Verify proposed solution is backed by text evidence │
└──────────────┬────────────────┘                                                     │
               │                                                                      │
        Is Grounded & Confident?                                                      │
        ├─── NO (Retry Count < 2) ──> [replan_query_node] ──> [hybrid_retrieve_node]  │
        ├─── NO (Retry Count >= 2) ─> [abstain_and_flag_node] ────────────────────────┤
        └─── YES                                                                      │
               │                                                                      │
               ▼                                                                      │
┌───────────────────────────────┐                                                     │
│   policy_verification_node    │  Ensure recommended parts & actions obey budget/SLA │
└──────────────┬────────────────┘                                                     │
               │                                                                      │
               ▼                                                                      │
┌───────────────────────────────┐                                                     │
│   execute_actions_node        │  Update ticket, assign tech, record audit entry    │
└──────────────┬────────────────┘                                                     │
               │                                                                      │
               ◄──────────────────────────────────────────────────────────────────────┘
               │
               ▼
             [END]
```

---

## 8. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Administrator | Facility Manager | Technician | Staff / Teacher |
| :--- | :---: | :---: | :---: | :---: |
| **Submit Ticket** | Yes | Yes | Yes | Yes |
| **View All Tickets** | Yes | Yes | Assigned / Room | Own Tickets |
| **Override Safety Classification** | No (System Locked) | No (System Locked)| No | No |
| **Approve Supervisor Escalation** | Yes | Yes | No | No |
| **Assign / Reassign Technician** | Yes | Yes | No | No |
| **Submit Fix Checklist & Parts** | Yes | Yes | Yes | No |
| **Verify Resolution & Close** | Yes | Yes | No | Requester Only |
| **Upload Knowledge Manuals** | Yes | Yes | No | No |
| **View Audit Logs & Agent Trace** | Yes | Yes | View-only (Self) | No |
| **Manage Buildings & Assets** | Yes | Yes | View-only | View-only |

---

## 9. Frontend Design System

The UI implements a high-density, authoritative operations control room aesthetic:
- **Palette**:
  - Deep Navy Base: `#0B132B` (Sidebar, primary brand surfaces)
  - Slate Charcoal Container: `#1C2541` (Cards, table headers, modals)
  - High Contrast Clean White: `#FFFFFF` (Primary text, active indicators)
  - Subtle Operational Blue: `#3A86FF` / `#48CAE4` (Active selections, status badges, focus rings)
  - Safety Alert Crimson: `#E63946` (Emergencies, hazard banners, SLA breaches)
  - Warning Amber: `#F4A261` (At-risk tickets, pending safety confirmations)
  - Verified Emerald: `#2A9D8F` (Resolved items, grounded RAG verification passes)
- **Typography**: Inter / Outfit sans-serif hierarchy with monospaced tabular numerals for countdown timers and asset identifiers.
- **States**: Every view implements explicit `LoadingSkeleton`, `EmptyState` (with actionable call to action), and `ErrorState` with retry mechanisms. Live operational metrics are never faked with randomized client intervals.
