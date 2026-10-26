# Security Remediation & Hardening Audit Report — ClassroomCare AI

**Institution:** Noorul Islam Centre for Higher Education (NIU), Kumaracoil  
**Application:** ClassroomCare AI — Facilities & Campus Operations  
**Date:** 2026-10-26  
**Auditor:** Principal DevSecOps & Application Security Lead  

---

## 1. Security Incidents & Vulnerability Remediation Summary

| ID | Vulnerability / Finding | Severity | Root Cause | Remediated In | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Secret key detected in Git draft commit (GH013) | **CRITICAL** | Staged active GCP API key in `.env.example` in commit `6ead2ee` | `.env.example`, `.gitignore` | **Verified PASS**: Replaced with generic placeholders; Git history sanitized; push accepted cleanly. Key rotation recommended in Google Console. |
| **SEC-002** | Client-controlled role escalation via HTTP headers | **HIGH** | `get_current_user` in `security.py` trusted client `X-User-Role` headers | `services/api/app/core/security.py` | **Verified PASS**: In production mode (`ENVIRONMENT=production` and `ENABLE_DEMO_DATA=False`), client headers cannot grant elevated roles. Unit test verified. |
| **SEC-003** | Missing HTTP Security Headers on frontend & backend | **MEDIUM** | Standard security response headers were not configured | `services/api/app/main.py`, `apps/web/vercel.json` | **Verified PASS**: Attached `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, and CSP. |
| **SEC-004** | Silent localhost fallback in production web client | **MEDIUM** | `api.ts` fell back to `http://localhost:8000/api/v1` in production bundles | `apps/web/src/lib/api.ts` | **Verified PASS**: `getNormalizedApiBase()` refuses localhost fallback in production and surfaces descriptive configuration notices. |
| **SEC-005** | Supabase Auth session token omitting | **MEDIUM** | API requests only sent mock role headers without Supabase JWTs | `apps/web/src/lib/api.ts` | **Verified PASS**: Attaches `Authorization: Bearer <session.access_token>` when active Supabase session exists. |
| **SEC-006** | Cross-Origin Resource Sharing (CORS) missing production origin | **MEDIUM** | Default `CORS_ORIGINS` in backend lacked `https://classroomcare-ai.vercel.app` | `services/api/app/core/config.py` | **Verified PASS**: Explicitly added production Vercel domain to `CORS_ORIGINS`. |

---

## 2. Deterministic Safety Engine & Zero-LLM-Override Protocol

ClassroomCare AI manages physical life-safety hazards (electrical arc flashes, gas leaks, burning odor, flooding near switchboards). The application enforces strict safety boundaries:
1. **Safety Rules Execute Before AI:** The deterministic rule engine ([`safety_rules.py`](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/services/api/app/core/safety_rules.py)) evaluates ticket content using regex pattern matching across electrical, fire, and structural hazard codes.
2. **Permanent Emergency Lock:** If a hazard code is triggered, the request priority is permanently set to `EMERGENCY` with `safety_priority_locked = True`.
3. **Barred AI Downgrades:** Neither user input nor generative model outputs can downgrade a locked emergency ticket.
4. **Immediate Switchboard Escalation:** Safety directives and campus emergency contact numbers (`(+91) 4651-250 566` / `112`) are permanently embedded in ticket data.

---

## 3. Row Level Security (RLS) & Tenant Isolation Audit

All database tables in [`supabase/migrations/20261026000003_rls_policies.sql`](file:///c:/Users/shameer/OneDrive/Documents/classroomcare-ai/ClassroomCare-App/supabase/migrations/20261026000003_rls_policies.sql) have Row Level Security enabled:
- `maintenance_requests`: Students read own; technicians read assigned; facilities managers read campus-wide.
- `work_orders`: Technicians update assigned; facilities managers dispatch; all updates logged to audit trail.
- `audit_events`: Append-only immutable log; access restricted to security officers and administrators.
- `knowledge_documents`: Read access for campus staff; write access restricted to facilities managers.
- **Tenant Scope:** Every query isolates records by `campus_code = 'NIU-KUMARACOIL'`.
