# ClassroomCare AI — Full Production Audit, Bug Fix & Deployment Validation Report

**Institution:** Noorul Islam Centre for Higher Education (NIU), Kumaracoil, Tamil Nadu, India  
**Branch:** `audit-fix-production`  
**Date:** October 27, 2026  
**Auditor:** Principal DevSecOps & Production Reliability Engineer  

---

## 1. Consolidated Production Audit & Verification Matrix

| Area | Initial Issue | Root Cause | Fix Implemented | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Supabase Database (Migration 2)** | `ERROR: 42P01: relation "knowledge_documents" does not exist` | Supabase installs extensions in schema `extensions`. Unqualified `vector(768)` in `document_chunks` aborted transaction, rolling back `knowledge_documents`. | Updated `20261026000002_pgvector_setup.sql` with schema grants, `SET search_path TO public, extensions;`, `extensions.vector(768)`, and `extensions.vector_cosine_ops`. | Remotely verified: Migration 1 tables exist (HTTP 200 `[]`); Migration 2 tables missing (HTTP 404 `PGRST205`). SQL ready for manual execution. | **REMOTELY VERIFIED / READY FOR SQL RUN** |
| **Supabase Database (Migration 3)** | Non-idempotent RLS policies | Re-running migration 3 would fail with `policy already exists`. | Added `DROP POLICY IF EXISTS` before each `CREATE POLICY` in `20261026000003_rls_policies.sql`. | Verified idempotent SQL; gated until Migration 2 verified. | **LOCALLY TESTED / PENDING MIGRATION 2** |
| **Building Option & Facilities Section** | Buildings navigation option was missing, direct URL `/buildings` hit 404, and empty state showed empty UI | Missing `/buildings` route in `App.tsx`, sidebar item labeled only "Facilities & Assets", no empty state handling, and missing `POST /buildings` and `POST /rooms` backend endpoints. | Added `/buildings` route in `App.tsx`, renamed nav to `Buildings & Facilities` in `Sidebar.tsx`, added interactive modals & empty states in `Facilities.tsx`, and implemented `POST /buildings` and `POST /rooms` with RBAC, campus isolation, and duplicate detection. | Frontend `tsc && vite build` passed (3.90s). Backend pytest passed: 49/49 tests. | **LOCALLY TESTED & VERIFIED** |
| **Dashboard Charts & Metrics** | Metrics displayed hardcoded sample values (`4.8h`, `100%`, `78%`) when live values were 0; fake Monday-Thursday chart data | JavaScript `|| 4.8` and `|| 100` falsified 0 values; backend `get_analytics()` returned fake hardcoded sample dictionaries. | Rewrote `get_analytics()` in `database.py` to compute live metrics from actual tickets with 7-day timestamp bucket aggregation; connected to persistent Supabase database; replaced frontend fallbacks with `??` and added empty state indicators. | Automated integration test `test_analytics_metrics_calculation_consistency` verified 7-day live trends and accurate percentage bounds. | **LOCALLY TESTED & VERIFIED** |
| **Google Gemini & Embeddings** | Deployed backend reported `llm_provider: mock`, `embedding_provider: mock`; modern flash models returned 404 with deprecated API names | Models `gemini-1.5-flash` and `text-embedding-004` sunsetted in API v1beta. | Updated models to `gemini-3.6-flash` / `gemini-3.5-flash-lite` and `gemini-embedding-001` with `outputDimensionality: 768` in `config.py`, `embeddings.py`, and `assistant.py`. | Live Google Generative Language API probe PASSED with HTTP 200 using `gemini-3.6-flash` and `gemini-embedding-001` (768-dim vector verified). | **LOCALLY TESTED & REMOTELY VERIFIED** |
| **Frontend Production Build** | Potential TypeScript and bundling regressions across charts and routes | Suboptimal route definitions and metric parsing. | TypeScript typecheck and full Vite bundle build validated without errors. | `tsc && vite build` passed with exit code 0 (1,029 kB minified bundle). | **LOCALLY TESTED** |
| **Backend API & Test Suite** | Missing endpoint coverage for building registration and analytics consistency | Incomplete test suite for facilities mutation endpoints. | Added integration tests in `test_api_endpoints.py` for authorized creation, unauthorized 403 checks, duplicate code 409, duplicate room 409, missing parent 404, and analytics sanity. | Pytest passed: 49 passed, 0 failed in 55.95s. | **LOCALLY TESTED** |
| **Production Render Backend Deployment** | Backend reported `llm_provider: mock` and timed out during initial cold-start probe | Render free-tier instance was spun down; dashboard env vars set to mock. | Woke up Render service; verified `/health` returns HTTP 200, CORS header allows `https://classroomcare-ai.vercel.app` with credentials. | Render API live: HTTP 200 OK (`status: healthy`, `environment: production`). | **DEPLOYMENT VERIFIED (Awaiting Git Push & Env Update)** |
| **Production Vercel Frontend Deployment** | SPA routes `/buildings` and `/analytics` previously hit 404 when opened directly | Vercel rewrite configuration was missing. | Tested live Vercel deployment: root `/`, `/buildings`, and `/analytics` now return HTTP 200 OK (1,250 bytes). | Deployed Vercel frontend verified active with SPA rewrites. | **DEPLOYMENT VERIFIED** |

---

## 2. Priority 1: Supabase Database Migration 2 Diagnostic & Solution

### Empirical Verification Evidence
Safe REST probe against `https://eoapihzhdkqwnvgnchew.supabase.co`:
- **Migration 1 Tables:**
  - `campuses`: HTTP 200 `[{"count":0}]`
  - `buildings`: HTTP 200 `[{"count":0}]`
  - `rooms`: HTTP 200 `[{"count":0}]`
  - `assets`: HTTP 200 `[{"count":0}]`
  - `maintenance_requests`: HTTP 200 `[{"count":0}]`
- **Migration 2 Tables:**
  - `knowledge_documents`: HTTP 404 (`PGRST205: Could not find table in schema cache`)
  - `document_chunks`: HTTP 404 (`PGRST205: Could not find table in schema cache`)
  - `agent_runs`: HTTP 404 (`PGRST205: Could not find table in schema cache`)

### Exact SQL to Run in Supabase SQL Editor
Run the following script in [Supabase Web SQL Editor](https://supabase.com/dashboard/project/eoapihzhdkqwnvgnchew/sql):

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
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON document_chunks USING GIN(tsv);
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

### SQL Verification Query
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('knowledge_documents', 'document_chunks', 'agent_runs');
```
*Expected Result:* Exactly 3 rows returned (`knowledge_documents`, `document_chunks`, `agent_runs`).

---

## 3. Priority 2 & 4: Facilities Section, Isolation & Duplicate Handling

### Implemented Endpoints & Rules:
1. `POST /api/v1/facilities/buildings`:
   - Authorization: Gated by `facilities:manage` permission.
   - Campus Isolation: Calls `verify_campus_isolation(building.campus_id, user)`.
   - Duplicate Detection: Returns `409 Conflict` if a building with the same ID or code already exists in that campus.
   - Persistence: Automatically persists to Supabase `buildings` table when configured.
2. `POST /api/v1/facilities/rooms`:
   - Authorization: Gated by `facilities:manage` permission.
   - Campus Isolation: Calls `verify_campus_isolation(room.campus_id, user)`.
   - Validation: Returns `404 Not Found` if the specified parent `building_id` does not exist in the campus.
   - Duplicate Detection: Returns `409 Conflict` if a room with the same `room_number` already exists in that building.
   - Persistence: Automatically persists to Supabase `rooms` table when configured.

---

## 4. Priority 3 & 5: Persistent Analytics Calculations

1. **Production Persistence:**
   - In production (`settings.ENVIRONMENT == "production"` or `ENABLE_DEMO_DATA=False`), `get_analytics` queries the persistent Supabase `maintenance_requests` table directly.
   - If 0 tickets are present in Supabase, metrics return true zero counts (`0` open, `0` in progress, `0` resolved, `0.0h` MTTR, `100.0%` SLA compliance) without fabricating mock data.
2. **7-Day Dynamic Intake & Resolution Trends:**
   - Generated from ticket `created_at` and `updated_at` timestamps aggregated into daily buckets for the past 7 days.
3. **Frontend Presentation:**
   - Eliminated `|| 4.8` and `|| 100` fallbacks.
   - Clean empty-state visual cards render when 0 trade incidents or 0 building hotspots exist.
   - Real JSON report export replaces the placeholder browser `alert()`.

---

## 5. Live Production Deployment Probe Results

```
--- DEPLOYED BACKEND PROBE (https://classroomcare-api.onrender.com) ---
/health: HTTP 200 OK (app: 'ClassroomCare AI — NIU Facilities & Campus Operations', environment: 'production')
/readiness: HTTP 200 OK (llm_provider: 'mock', embedding_provider: 'mock', status: 'ready')
CORS OPTIONS: HTTP 200 OK (access-control-allow-origin: 'https://classroomcare-ai.vercel.app', access-control-allow-credentials: 'true')

--- DEPLOYED FRONTEND PROBE (https://classroomcare-ai.vercel.app) ---
Frontend /: HTTP 200 OK (1,250 bytes)
Frontend /buildings: HTTP 200 OK (1,250 bytes)
Frontend /analytics: HTTP 200 OK (1,250 bytes)
```

---

## 6. Pending Actions Before Production Sign-Off

1. **Supabase SQL Editor:** Execute Migration 2 (`20261026000002_pgvector_setup.sql`) and run the verification query.
2. **Supabase Migration 3:** Once Migration 2 is verified, execute Migration 3 (`20261026000003_rls_policies.sql`).
3. **Seed Data Review:** Review `20261026000004_seed_data.sql` before execution to ensure campus fixture compliance.
4. **Render Environment Variables:** Update Render dashboard environment variables:
   - `LLM_PROVIDER=gemini`
   - `GEMINI_MODEL=gemini-3.6-flash`
   - `EMBEDDING_PROVIDER=gemini`
   - `EMBEDDING_MODEL=gemini-embedding-001`
5. **Git Merge & Push:** Review changes on `audit-fix-production` and merge into `main` to trigger production deployment.
