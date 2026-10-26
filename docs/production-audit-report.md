# ClassroomCare AI — Full Production Audit, Bug Fix & Deployment Validation Report

**Institution:** Noorul Islam Centre for Higher Education (NIU), Kumaracoil, Tamil Nadu, India  
**Branch:** `audit-fix-production`  
**Date:** October 27, 2026  
**Auditor:** Principal DevSecOps & Production Reliability Engineer  

---

## 1. Executive Summary & Audit Matrix

| Area | Initial Issue | Root Cause | Fix Implemented | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Supabase Database (Migration 2)** | `ERROR: 42P01: relation "knowledge_documents" does not exist` | Supabase installs extensions under the `extensions` schema. `vector(768)` unqualified in public search path caused silent rollback in multi-statement transaction, leaving tables uncreated. | Updated `20261026000002_pgvector_setup.sql` with schema grants, `SET search_path TO public, extensions;`, `extensions.vector(768)`, and `extensions.vector_cosine_ops`. | Schema-hardened SQL prepared; REST probe verified Migration 1 tables exist (HTTP 200). Ready for SQL Editor execution. | **RESOLVED / READY FOR SQL RUN** |
| **Supabase Database (Migration 3)** | Non-idempotent RLS policy creation | Re-running migration 3 would fail on `policy already exists`. | Added `DROP POLICY IF EXISTS` before each policy creation in `20261026000003_rls_policies.sql`. | Fully idempotent SQL verified. | **RESOLVED** |
| **Building Option & Facilities Section** | Buildings navigation option was missing, direct URL `/buildings` hit 404, and empty state showed empty UI | Missing `/buildings` route in `App.tsx`, sidebar item labeled only "Facilities & Assets", no empty state handling, and missing `POST /buildings` and `POST /rooms` backend endpoints. | Added `/buildings` route in `App.tsx`, renamed nav item to `Buildings & Facilities`, added interactive modals for building & classroom registration, and implemented `POST /buildings` and `POST /rooms` with RBAC. | Frontend `tsc && vite build` built in 13.07s; backend pytest passed 45/45 tests. | **VERIFIED & RESOLVED** |
| **Dashboard Charts & Metrics** | Metrics displayed hardcoded sample values (`4.8h`, `100%`, `78%`) when live values were 0; fake Monday-Thursday chart data | JavaScript `|| 4.8` and `|| 100` falsified 0 values; backend `get_analytics()` returned fake hardcoded sample dictionaries. | Rewrote `get_analytics()` to compute live metrics from actual tickets with 7-day timestamp bucket aggregation; replaced frontend fallbacks with `??` and added empty state indicators. | Tested via `test_analytics_metrics_calculation_consistency` (HTTP 200, 7 days trend, real percentages). | **VERIFIED & RESOLVED** |
| **Google Gemini & Embeddings** | Deployed backend reported `llm_provider: mock`, `embedding_provider: mock`; modern flash models returned 404 with deprecated API names | Models `gemini-1.5-flash` and `text-embedding-004` sunsetted in API v1beta. | Updated models to `gemini-3.6-flash` / `gemini-3.5-flash-lite` and `gemini-embedding-001` with `outputDimensionality: 768`. | Live Google Generative Language API probe PASSED with HTTP 200 using `gemini-3.6-flash` and `gemini-embedding-001` (768-dim vector verified). | **VERIFIED & RESOLVED** |
| **Frontend Production Build** | Potential TypeScript and bundling regressions across charts and routes | Suboptimal route definitions and metric parsing. | TypeScript typecheck and full Vite bundle build validated without errors. | `tsc && vite build` passed with exit code 0. | **PASSED** |
| **Backend API & Test Suite** | Missing endpoint coverage for building registration and analytics consistency | Incomplete test suite for facilities mutation endpoints. | Added integration tests in `test_api_endpoints.py` for authorized creation, unauthorized 403 checks, and analytics sanity. | Pytest passed: 45 passed, 0 failed in 53.76s. | **PASSED** |

---

## 2. Priority 1: Supabase Database Migration 2 Diagnostic & Solution

### Root Cause Analysis
1. Supabase installs community and core PostgreSQL extensions into the dedicated `extensions` schema rather than `public`.
2. In `20261026000002_pgvector_setup.sql`, the column `embedding vector(768)` was declared without setting `search_path` or qualifying the type as `extensions.vector(768)`.
3. When the execution reached `document_chunks`, PostgreSQL threw type error `type "vector" does not exist`. Because Supabase Web SQL Editor runs scripts in an atomic transaction block, the initial `CREATE TABLE knowledge_documents` was rolled back.
4. When subsequent queries or migrations (e.g. Migration 3: `ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;`) were executed, PostgreSQL returned:
   ```
   ERROR: 42P01: relation "knowledge_documents" does not exist
   ```

### Corrective Action & Exact SQL to Run
The corrected, hardened file `supabase/migrations/20261026000002_pgvector_setup.sql` is ready.

Run the following SQL in the **Supabase Web SQL Editor** (`https://supabase.com/dashboard/project/eoapihzhdkqwnvgnchew/sql`):

```sql
-- Migration: 20261026000002_pgvector_setup.sql
-- Description: pgvector extension, knowledge documents, chunks, and hybrid search indexes

-- 1. Enable vector extension safely in extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
SET search_path TO public, extensions;

-- 2. Knowledge Documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    file_type VARCHAR(32) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    chunk_count INT NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Ready',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Document Chunks with Vector (768) and Full-Text Search
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    document_title VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding extensions.vector(768),
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Hybrid Search Indexes
-- Full-Text Search GIN index
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON document_chunks USING GIN(tsv);

-- HNSW index for pgvector cosine distance
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding extensions.vector_cosine_ops);

-- 5. Agent Execution Runs
CREATE TABLE IF NOT EXISTS agent_runs (
    id VARCHAR(64) PRIMARY KEY,
    ticket_id VARCHAR(64) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    campus_id VARCHAR(64) REFERENCES campuses(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    nodes_executed JSONB NOT NULL DEFAULT '[]'::jsonb,
    deterministic_safety_hit BOOLEAN NOT NULL DEFAULT FALSE,
    replan_count INT NOT NULL DEFAULT 0,
    decision_summary TEXT NOT NULL,
    recommended_priority VARCHAR(32) NOT NULL,
    recommended_category VARCHAR(64) NOT NULL,
    recommended_technician VARCHAR(255),
    citations JSONB DEFAULT '[]'::jsonb,
    executed_tools JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_ticket ON agent_runs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_campus ON agent_runs(campus_id);
```

### Verification Query to Run After Execution
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('knowledge_documents', 'document_chunks', 'agent_runs');
```
**Expected Output:** Exactly 3 rows returned (`knowledge_documents`, `document_chunks`, `agent_runs`).

---

## 3. Priority 2: Building Option and Building Section Resolution

### Root Causes
1. **Routing:** `apps/web/src/App.tsx` only had `/facilities`, so direct navigation or bookmarks to `/buildings` landed on the `NotFound` component.
2. **Navigation:** `apps/web/src/components/layout/Sidebar.tsx` labeled the navigation item "Facilities & Assets" and only highlighted on exact `/facilities` match.
3. **Empty State:** `apps/web/src/pages/Facilities.tsx` expected pre-existing building records. If none existed or an error occurred, it rendered an empty selector bar with no explanation or action.
4. **Backend Mutation API:** Backend lacked `POST /api/v1/facilities/buildings` and `POST /api/v1/facilities/rooms` endpoints to register new campus infrastructure.

### Implemented Fixes
1. Added `<Route path="buildings" element={<Facilities />} />` in `App.tsx`.
2. Updated `Sidebar.tsx` to display **Buildings & Facilities** and match active state for both `/buildings` and `/facilities`.
3. Enhanced `Facilities.tsx`:
   - Interactive modal: **Register Campus Building** (Code, Name, Total Floors, Emergency Shutoff Location).
   - Interactive modal: **Add Classroom / Lab Space** (Space Name, Room Number, Floor, Room Type, Capacity).
   - Clear empty states with call-to-action buttons when 0 buildings exist.
   - Database connectivity error alert banner with a Retry button.
4. Added backend endpoints in `services/api/app/api/v1/facilities.py`:
   - `POST /buildings` with `facilities:manage` RBAC enforcement.
   - `POST /rooms` with `facilities:manage` RBAC enforcement.
   - Permitted unauthenticated catalog reads (`GET /buildings`, `GET /rooms`, `GET /assets`) so reporting forms load seamlessly.

---

## 4. Priority 3: Dashboard Graphs and Visualizations Audit

### Audit Findings & Fixes
1. **Falsified Metric Fallbacks:**
   - In `Overview.tsx` and `Analytics.tsx`, expressions like `{analytics?.average_resolution_hours || 4.8}h` and `{analytics?.sla_compliance_rate || 100}%` converted valid zero values (e.g. 0 resolved tickets, 0 MTTR) into fake sample figures (`4.8h`, `100%`).
   - Replaced all `||` with explicit nullish checks: `analytics?.average_resolution_hours != null ? ... : '0.0h'`.
2. **Fake Trend Data:**
   - `services/api/app/core/database.py` previously contained a hardcoded Monday-Thursday mock trend array.
   - Rewrote `get_analytics()` to dynamically group tickets by date over the past 7 days based on creation and resolution timestamps.
3. **Empty Chart Rendering:**
   - Added user-friendly empty state banners to `Overview.tsx` and `Analytics.tsx` when 0 incidents or 0 categories exist, preventing empty SVG rendering artifacts.
4. **Real Export:**
   - Replaced the placeholder `alert(...)` on the "Export Executive Report" button in `Analytics.tsx` with a verified JSON export download containing live campus metrics and breakdowns.

---

## 5. Priority 7: Gemini & Embeddings Live Validation

### Root Cause of Mock Fallback
1. Render environment had `LLM_PROVIDER=mock` and `EMBEDDING_PROVIDER=mock`.
2. `gemini-1.5-flash` and `text-embedding-004` returned HTTP 404 in late 2026 API v1beta endpoints.
3. Tested live against Google Generative Language API:
   - `gemini-3.6-flash`: **HTTP 200 OK** (Verified text generation).
   - `gemini-embedding-001` with `outputDimensionality: 768`: **HTTP 200 OK** (Verified 768-dimensional float embedding vector matching the database column).
4. Updated defaults in `config.py`, `embeddings.py`, and `assistant.py`.

---

## 6. Test Suite & Verification Results

### Backend Automated Test Suite
Ran 45 automated tests via `pytest`:
```
======================= 45 passed, 1 warning in 53.76s ========================
```
- Integration tests: 26 passed
- RAG & evaluation tests: 10 passed
- Safety rules tests: 6 passed
- Security hardening tests: 3 passed

### Frontend Production Build
Ran `tsc && vite build`:
```
dist/index.html                     1.25 kB │ gzip:   0.65 kB
dist/assets/index-DnJ9zq_t.css     35.95 kB │ gzip:   7.43 kB
dist/assets/index-D7M72XT7.js   1,029.23 kB │ gzip: 275.45 kB
✓ built in 13.07s
Exit code: 0
```
Zero TypeScript compiler errors; bundle generated successfully.
