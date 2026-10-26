# ClassroomCare AI — NIU Facilities & Campus Operations

> **Autonomous Classroom Maintenance & Operational Intelligence Platform**  
> Custom-engineered for **Noorul Islam Centre for Higher Education (NIU)**, Kumaracoil, Tamil Nadu, India.  
> Official University Portal: [https://www.niuniv.com/](https://www.niuniv.com/)  
> GitHub Repository: [https://github.com/Shameer28tm/classroomcare-ai.git](https://github.com/Shameer28tm/classroomcare-ai.git)

ClassroomCare AI pairs deterministic physical life-safety triage with controlled, grounded LangGraph agent orchestration and hybrid pgvector RAG over institutional manuals, equipment service playbooks, and university safety SOPs.

---

## 1. Platform Highlights & Features

- **Operations Intelligence Console:** Real-time KPI cards (Open tickets, in progress, resolved today, critical hazards, SLA compliance, MTTR), weekly intake velocity charts, and active dispatch preview.
- **Maintenance Request Queue:** Full intake lifecycle with verified building and room selection, trade category filtering, deterministic priority locking, and SLA target countdowns.
- **Deterministic Life-Safety Shield:** Zero-override rule engine that permanently locks life-safety incidents (active sparking, gas odor, burning smells, flooding near panels) to `EMERGENCY` and attaches mandatory safety directives and campus switchboard escalation (`(+91) 4651-250 566` / `112`).
- **Technician Workbench:** Dispatched work order queue, interactive pre-service safety checklists (LOTO, PPE, diagnostic checks), replacement parts logging, and completion evidence recording.
- **Facilities & Equipment Registry:** Academic infrastructure mapping for NIU blocks (Aeronautical & Aerospace Engineering, Computer Science Tech Block, Allied Health Sciences, Central Library), classrooms, labs, and equipment assets.
- **SLA Monitoring & Escalation:** Configurable response and resolution tiers with real-time breach countdowns and verified institutional contacts.
- **Grounded Technical RAG Assistant:** Hybrid vector and keyword retrieval over equipment service manuals, verifiable source passage citations, and strict abstention protocol when documentation is insufficient.
- **AI Agent Telemetry:** Full 14-node LangGraph execution trace visualization, state transition auditing, and replanning loop controls.
- **Notification Center:** Prioritized alert stream for safety broadcasts, work order dispatches, and SLA breach warnings.
- **Administration & Governance:** Proposed institutional RBAC matrix across 5 roles, immutable system audit logs, and 6-phase Supabase connection diagnostics.
- **macOS-Inspired Design System:** Polished light-first UI built with Vanilla CSS tokens (`apps/web/src/styles/design-tokens.css`), Apple cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`), mobile responsive drawer, and toggleable macOS dark theme.
- **Interactive Orientation & Help Manual:** First-run interactive onboarding tour (`OnboardingTour.tsx`) and dedicated in-app Help & User Guide (`/guide`) covering beginner to advanced workflows.

---

## 2. Technology Stack & Architecture

```
                           +-----------------------------------+
                           |     React 18 + Vite Frontend      |
                           |  macOS Vanilla CSS (design-tokens)|
                           |  (Professional Light-First UI)    |
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

- **Frontend (`apps/web`)**: React 18, TypeScript 5, Vite, Lucide React, Recharts, `@supabase/supabase-js`, Vanilla CSS tokens.
- **Backend (`services/api`)**: Python 3.11+, FastAPI, Pydantic v2, LangGraph state machine, deterministic safety engine.
- **Database (`supabase/migrations`)**: Supabase PostgreSQL 16, `pgvector`, Row Level Security (RLS) policies, full-text search.
- **Institutional Context**: Noorul Islam Centre for Higher Education (NIU), Kumaracoil campus (`NIU-KUMARACOIL`). Facilities Lead: `Abishek` (Role: Facilities Manager; demo unverified profile).

---

## 3. Local Quickstart Instructions

### Step 1: Clone Repository & Setup Environment
```powershell
cd c:\Users\shameer\OneDrive\Documents\classroomcare-ai\ClassroomCare-App
cp .env.example .env
```

### Step 2: Run Backend Service (Terminal 1)
```powershell
cd services\api
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`
- Readiness Endpoint: `http://localhost:8000/readiness`
- Supabase Status: `http://localhost:8000/supabase-status`
- Gemini Status: `http://localhost:8000/gemini-status`

### Step 3: Run Frontend Web Application (Terminal 2)
```powershell
cd apps\web
npm run dev
```
- Open your browser at: `http://localhost:5173/`

---

## 4. Running Automated Tests & Verifications

```powershell
# 1. Run All Backend Tests (38 Tests Passing: Endpoints, RAG, Safety)
.\services\api\.venv\Scripts\python -m pytest

# 2. Run 10 Critical User Journeys Evaluation Benchmark
.\services\api\.venv\Scripts\python scripts/run_agent_eval.py

# 3. Run Frontend Type-Check & Production Build
cd apps\web
npm run build
```

---

## 5. Key Documentation & Engineering Reports

- [Comprehensive Verification Report](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/verification-report.md) — Authoritative results, test evidence & status matrix.
- [Supabase Setup Guide](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/supabase-setup-guide.md) — Beginner-friendly step-by-step connection manual.
- [API Verification Report](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/api-verification-report.md) — Route audit, schemas, auth, and automated test results.
- [RAG Verification Report](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/rag-verification-report.md) — RAG pipeline evaluation, citations, and injection tests.
- [In-App Software User Guide](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/user-guide.md) — Complete user manual (Sections A-F).
- [Architecture Blueprint](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/architecture.md) — Architectural design, topology & contracts.
- [NIU Public Source Inventory](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/niu-public-source-inventory.md) — Provenance records from `https://www.niuniv.com/`.
- [Safety Policy Matrix](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/safety-policy-matrix.md) — Deterministic hazard definitions & emergency protocol.
- [Implementation Plan](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/implementation-plan.md) — Phased roadmap and completed tasks.
- [GitHub Profile Recommendations](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/docs/github-profile-recommendations.md) — Repository topics, metadata, and profile README template.

---

## 6. DevSecOps, Governance & Quality Gates

ClassroomCare AI incorporates automated quality gates and security controls:
- **Automated CI Workflow:** `.github/workflows/ci.yml` runs Gitleaks secret scanning, 38 backend Pytest cases, multi-agent CUJs, and Vite production builds on every push and pull request.
- **Security Policy:** See [`SECURITY.md`](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/SECURITY.md) for vulnerability disclosure channels (`shameertmdevop@gmail.com`) and credential incident response protocols.
- **Contribution Guidelines:** See [`CONTRIBUTING.md`](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/CONTRIBUTING.md) for conventional commits and local quality checks.
- **License:** Distributed under the [MIT License](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/LICENSE).
