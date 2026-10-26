# Frontend Production Audit — ClassroomCare AI × NIU

**Institutional Scope:** Noorul Islam Centre for Higher Education (NIU), Kumaracoil  
**Frontend Application:** `apps/web` (React 18, TypeScript 5, Vite)  
**Production URL:** [https://classroomcare-ai.vercel.app/](https://classroomcare-ai.vercel.app/)  
**Audit Date:** 2026-10-26  
**Status:** **Verified PASS** (Local & Build Checks) / **Pending Remote Backend Integration**  

---

## 1. Executive Summary & Defect Remediation

| Audit Area | Previous Vulnerability / Defect | Remediation Implemented | Verification Status |
| :--- | :--- | :--- | :--- |
| **API Base URL** | Silent fallback to `http://localhost:8000/api/v1` in production | Strict environment detection (`getNormalizedApiBase`), URL normalization, and descriptive offline state in production | **Verified PASS** |
| **SPA Route 404s** | Direct requests / refreshes on `/tickets`, `/guide`, etc. returned HTTP 404 | Configured `apps/web/vercel.json` with universal SPA rewrites to `/index.html` | **Verified PASS** |
| **Catch-All Routing** | Unmatched routes redirected silently to `/` | Dedicated [`NotFound.tsx`](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/apps/web/src/pages/NotFound.tsx) with navigation actions and error details | **Verified PASS** |
| **Branding & Metadata** | Vite starter template favicon (`/vite.svg`) and generic title | Custom NIU-themed SVG shield favicon and institutional title / metadata | **Verified PASS** |
| **Authentication Headers** | Untrusted client-side `X-User-Role` headers sent blindly | Integrated Supabase Auth session token (`Bearer <token>`); restricted demo role headers to development/demo mode | **Verified PASS** |
| **Network Resilience** | Indefinite fetch hangs on dropped connections | `AbortController` 15-second timeout, descriptive network error mapping, and retry buttons | **Verified PASS** |
| **User Action Feedback** | Uncaught promises / silent failures on document upload, triage, and ticket assignment | Added explicit error states and visual alert banners across all pages | **Verified PASS** |

---

## 2. API Client Normalization & Production Safety (`apps/web/src/lib/api.ts`)

The API client was hardened to guarantee:
1. **No Duplicate Slashes or Path Segments:** If `VITE_API_URL` is configured as `https://backend.onrender.com/api/v1/`, trailing slashes and redundant segments are normalized cleanly.
2. **Production Safeguard:** When running in production (`import.meta.env.PROD`), if `VITE_API_URL` is omitted or unconfigured, the application refuses to connect to `localhost:8000` and surfaces a clear administrative notice.
3. **Supabase Auth Token Propagation:** Every authenticated request queries `supabase.auth.getSession()` and attaches `Authorization: Bearer <access_token>`.
4. **Timeout & Abort Handling:** All outbound API requests utilize `AbortController` with a 15-second threshold to prevent UI lockups on cold starts.

---

## 3. Vercel SPA Routing & Security Header Policies (`apps/web/vercel.json`)

Vercel configuration now provides:
- **Universal SPA Rewrites:**
  ```json
  "rewrites": [
    {
      "source": "/((?!assets/|favicon\\.svg|robots\\.txt).*)",
      "destination": "/index.html"
    }
  ]
  ```
- **Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 https://*.supabase.co wss://*.supabase.co https://*.onrender.com https://classroomcare-ai.vercel.app; frame-ancestors 'none'; object-src 'none'; base-uri 'self';`

---

## 4. UI/UX Page Audit & State Hardening

- **Operations Console (`/`):** Real-time KPI cards, SLA compliance counters, active emergency hazard alert banner with sound alert styling, and manual refresh triggers.
- **Maintenance Tickets (`/tickets`):** Multi-criteria filtering by category, priority, and status; search bar across titles and room numbers; retry banner on database disconnect.
- **Ticket Detail Drawer:** LOTO safety protocol callout; technician dispatch modal with verified technician roster; resolution verification with feedback recording.
- **Technician Workbench (`/technician`):** Pre-service safety checklist (LOTO, PPE, Airflow, Debris clearance); replacement part logging with quantity validation; resolution evidence submission.
- **Knowledge Base (`/knowledge`):** Real-time technical question answering with RAG confidence scoring; OEM passage citations; formal abstention badge on out-of-scope queries; document text ingestion with category tagging.
- **Help & User Guide (`/guide`):** 6-tab comprehensive operational manual covering all roles, deterministic emergency protocols, SLA matrices, and troubleshooting.
- **Not Found Page (`*`):** Clear 404 state with navigation shortcuts back to console, tickets, or user guide.
