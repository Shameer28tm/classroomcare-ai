# Production Deployment & Infrastructure Report — ClassroomCare AI

**Institution:** Noorul Islam Centre for Higher Education (NIU), Kumaracoil  
**Frontend Deployment:** Vercel ([https://classroomcare-ai.vercel.app/](https://classroomcare-ai.vercel.app/))  
**Backend Host Target:** Render Web Service (FastAPI)  
**Database Host Target:** Supabase PostgreSQL 16 (with pgvector & RLS)  
**Date:** 2026-10-26  

---

## 1. Deployment Topology

```
+-------------------------------------------------------------------------+
|                  Vercel Production Edge (apps/web)                      |
|                  https://classroomcare-ai.vercel.app                    |
|  - React 18 / TypeScript SPA                                            |
|  - vercel.json SPA Rewrites (/tickets, /guide -> /index.html)           |
|  - Strict Security Headers (CSP, Frame-Options, nosniff)                |
+------------------------------------+------------------------------------+
                                     |
                       HTTPS REST / SSE Streams
                                     |
                                     v
+-------------------------------------------------------------------------+
|                 Render FastAPI Backend Service (services/api)           |
|                 https://<render-service-name>.onrender.com              |
|  - Uvicorn ASGI Server                                                  |
|  - Starlette Security Headers Middleware                                |
|  - Deterministic Life-Safety Rules Engine (Zero LLM Override)           |
|  - LangGraph State Machine & Multi-Agent Triage                         |
+------------------------------------+------------------------------------+
                                     |
                         PostgreSQL 16 / SSL
                                     |
                                     v
+-------------------------------------------------------------------------+
|                 Supabase Hosted Database (supabase/migrations)          |
|                 https://<project-ref>.supabase.co                       |
|  - Row Level Security (RLS) on all operational tables                   |
|  - pgvector 768-dim embeddings for OEM manuals                          |
|  - Campus Isolation (NIU-KUMARACOIL)                                    |
+-------------------------------------------------------------------------+
```

---

## 2. Infrastructure Configuration & Deployment Status

| Service Component | Configuration Target | Deployment Status | Verification Status & Action Required |
| :--- | :--- | :--- | :--- |
| **Vercel Frontend** | Root Directory: `apps/web` | **Verified PASS** | Automated deployment via GitHub Push on `main`. SPA rewrites active. |
| **Render Backend** | Root Directory: `services/api` | **Blocked by Missing Configuration** | FastAPI service code is verified locally (41/41 tests passing). A live Render service URL must be deployed and configured in Vercel as `VITE_API_URL`. |
| **Supabase Database** | Hosted PostgreSQL 16 | **Requires Manual Approval** | Migration scripts in `supabase/migrations/` ready for deployment (`supabase db push`). Never applied automatically without project credentials. |
| **Google Gemini API** | Model: `gemini-1.5-flash` | **Requires Manual Approval** | Active API key must be provisioned in backend environment. Fallback mock provider currently active and verified. |

---

## 3. Required Vercel Environment Variables

To connect the live Vercel frontend to your deployed backend and database, set these variables in the **Vercel Dashboard -> Project Settings -> Environment Variables**:

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Production, Preview | Full HTTPS URL of your deployed Render backend (e.g. `https://classroomcare-api.onrender.com/api/v1`) |
| `VITE_SUPABASE_URL` | Production, Preview | Your hosted Supabase Project URL (e.g. `https://your-project-id.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview | Your public Supabase Anon key |
| `VITE_ENABLE_DEMO_FIXTURES` | Development, Preview | Set to `false` in production to enforce strict authentication boundaries |
