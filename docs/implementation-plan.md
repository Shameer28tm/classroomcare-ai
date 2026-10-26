# ClassroomCare AI × NIU: Implementation Plan & Execution Log

**Platform:** ClassroomCare AI — NIU Facilities & Campus Operations  
**Target Institution:** Noorul Islam Centre for Higher Education (NIU), Kumaracoil, Tamil Nadu  
**Official Website:** [https://www.niuniv.com/](https://www.niuniv.com/)  
**GitHub Repository:** [https://github.com/Shameer28tm/classroomcare-ai.git](https://github.com/Shameer28tm/classroomcare-ai.git)  
**Current Date:** 2026-10-26  
**Auditor & Implementation Lead:** Senior Full-Stack & Supabase Security Systems Architect  

---

## Phased Execution Roadmap & Status

### Phase 1: Workspace & Codebase Audit (COMPLETED)
- [x] Inspect Git working copy, branch `main`, and uncommitted changes.
- [x] Inspect frontend routes, components, styles, and build configuration.
- [x] Inspect FastAPI endpoints, schemas, services, settings, and dependency injection.
- [x] Inspect existing 4 SQL migrations (`initial_schema`, `pgvector_setup`, `rls_policies`, `seed_data`).
- [x] Create comprehensive audit document in `docs/implementation-audit.md`.

### Phase 2: Official Website Research & Institutional Identity (COMPLETED)
- [x] Research publicly accessible pages on `https://www.niuniv.com/` (Homepage, Contact, Departments).
- [x] Verify institutional facts:
  - Official Name: Noorul Islam Centre for Higher Education (Deemed to be University, NAAC 'A' Grade).
  - Campus Code: `NIU-KUMARACOIL`.
  - Address: Kumaracoil, Thuckalay, Kanyakumari District, Tamil Nadu, India - 629 180.
  - Official Switchboard: `(+91) 4651-250 566` / `250 567`, Mobile: `+91 94868 56101`, Email: `info@niuniv.com`.
  - Academic Infrastructure: Aeronautical & Aerospace Engineering Block, CSE Tech Block, Allied Health Sciences Complex, Central Library.
- [x] Create provenance inventory in `docs/niu-public-source-inventory.md`.
- [x] Establish centralized typed institutional configurations:
  - Frontend: `apps/web/src/config/institution.ts`
  - Backend: `services/api/app/core/institution.py`

### Phase 3: Replace Demo Identity & Update Fixtures (COMPLETED)
- [x] Search entire repository for legacy demo identity `Dr. Marcus Vance`.
- [x] Replace display identity with `Abishek` (Role: Facilities Manager).
- [x] Do not invent surname, institutional email, phone, or login password.
- [x] Label identity explicitly as an *unverified demo record* awaiting official administrator provisioning.
- [x] Update database seed migration `20261026000004_seed_data.sql` and memory repository with NIU academic blocks and equipment.

### Phase 4: Supabase Integration & Startup Diagnostics (COMPLETED)
- [x] Install `@supabase/supabase-js` in `apps/web`.
- [x] Implement frontend Supabase client and validation in `apps/web/src/lib/supabase.ts` (supports both `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_ANON_KEY`).
- [x] Implement backend Supabase status module in `services/api/app/core/supabase.py` with 6-phase granular diagnostics.
- [x] Expose `/supabase-status`, `/gemini-status`, and enhanced `/readiness` endpoints with actionable setup instructions.
- [x] Authored complete step-by-step setup guide in `docs/supabase-setup-guide.md`.

### Phase 5: Security, Token Validation & RBAC Permissions (COMPLETED)
- [x] Implement Bearer token extraction and validation in `services/api/app/core/security.py`.
- [x] Add explicit 401 handling for expired, invalid, or malformed tokens.
- [x] Enforce `require_permission(...)` across routes:
  - Ticket assignment (`requests:assign`) restricted to Facilities Manager & Admin.
  - Work order evidence (`work_orders:record_evidence`) restricted to Technicians & Managers.
  - Resolution verification (`requests:verify_resolution`) restricted to Managers & Admins.
  - Document upload (`knowledge:upload`) restricted to Facilities Manager.
  - Audit log review (`audit:view_safety`) restricted to Safety Officer & Manager.
  - Asset creation (`facilities:manage`) restricted to Facilities Manager.

### Phase 6: End-to-End RAG Pipeline & Evaluation (COMPLETED)
- [x] Evaluate multi-index hybrid search (vector embeddings + keyword BM25 via RRF).
- [x] Enforce formal abstention protocol when keyword or conceptual grounding is insufficient.
- [x] Verify adversarial prompt injection resistance in document chunks (cannot override system instructions or life-safety rules).
- [x] Ensure offline fallback without Gemini provides verified template synthesis with zero downtime.
- [x] Author comprehensive evaluation report in `docs/rag-verification-report.md`.

### Phase 7: macOS-Inspired Design System & UI/UX (COMPLETED)
- [x] Author centralized CSS custom properties in `apps/web/src/styles/design-tokens.css` with Apple cubic-bezier curves, window accents, and complete `[data-theme="dark"]` tokens.
- [x] Add mobile responsive drawer and backdrop overlay to `Sidebar.tsx`.
- [x] Add mobile hamburger toggle, theme toggle (Light/Dark), and Tour button to `Header.tsx`.
- [x] Build interactive `OnboardingTour.tsx` with step-by-step orientation, skip/prev/next/finish, and restart capability.
- [x] Build in-app `UserGuide.tsx` (`/guide`) covering sections A through E.
- [x] Author complete reference document `docs/user-guide.md`.

### Phase 8: Testing, Quality Assurance & Verification (COMPLETED)
- [x] Pytest backend test suites: **38/38 tests PASSED** (`test_api.py`, `test_api_endpoints.py`, `test_rag.py`, `test_rag_eval.py`, `test_safety_rules.py`).
- [x] Agent evaluation: **10/10 Critical User Journeys PASSED** (`scripts/run_agent_eval.py`).
- [x] Frontend build: **PASSED** (`npm run build` in 4.06s with 0 errors).
- [x] Browser subagent verification: **PASSED** (Navigated UI, completed onboarding tour, verified guide tabs and tickets table; recording saved).
- [x] Author authoritative verification report `docs/verification-report.md` and API report `docs/api-verification-report.md`.
- [x] Update root `README.md`.
