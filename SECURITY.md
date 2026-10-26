# Security Policy — ClassroomCare AI

## 1. Security Overview & Philosophy

ClassroomCare AI is designed for institutional campus operations at **Noorul Islam Centre for Higher Education (NIU)**. Because the platform manages physical campus safety, electrical breaker locks, and building maintenance dispatches, security is built on a **defense-in-depth and zero-override model**:

1. **Deterministic Safety Priority Lock:** Physical life-safety hazards cannot be downgraded or overridden by any language model or unprivileged user.
2. **Server-Validated RBAC:** Client-side role selection is strictly a developer sandbox tool. Real authorization boundaries are enforced on the backend via Supabase JWT verification and PostgreSQL Row Level Security (RLS).
3. **Least Privilege Secret Management:** Production credentials (such as `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL`) must reside exclusively in local server environments. Secret keys are never compiled into frontend client bundles or checked into version control.
4. **Grounded AI Retrieval:** RAG responses are strictly tethered to cited technical manual passages. The assistant explicitly abstains when documentation is absent, preventing dangerous hallucinations.

---

## 2. Supported Versions

| Version | Supported | Security Maintenance Status |
| :--- | :--- | :--- |
| `1.0.x` (Current) | :white_check_mark: | Active security updates and dependency audits |
| `< 1.0.0` | :x: | Deprecated preview builds |

---

## 3. Reporting a Vulnerability

We welcome responsible security disclosures. If you discover a potential security flaw, vulnerability, or secret exposure in ClassroomCare AI, **do not open a public GitHub issue**.

### Reporting Channel:
- **Email:** `shameertmdevop@gmail.com`
- **Subject:** `[SECURITY] ClassroomCare AI Vulnerability Report`

### Information to Include:
- Summary of the vulnerability and affected components (e.g., API endpoint, RLS policy, frontend bundle).
- Step-by-step reproduction instructions or proof-of-concept payload.
- Potential impact and assessment of exploitability.
- Any suggested mitigations.

### Response SLA:
- **Initial Response:** Within 24 hours of report receipt.
- **Triage & Remediation Plan:** Within 72 hours.
- **Public Disclosure:** Coordinated disclosure only after a patch is verified and deployed.

---

## 4. Compromised Credential Revocation Protocol

If an API key, service account, or token is accidentally exposed:
1. **Immediate Revocation:** The credential must be immediately revoked or rotated in the provider console:
   - **Google Cloud / Gemini API Keys:** Revoke via [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials) or [Google AI Studio](https://aistudio.google.com/app/apikey).
   - **Supabase Service Role / Anon Keys:** Rotate via [Supabase Dashboard -> Project Settings -> API](https://supabase.com/dashboard).
2. **Git History Remediation:** Never bypass GitHub Push Protection or allowlist active secrets. Remove the commit from history before publishing to remote.
3. **Audit Trails:** Inspect access logs in the respective provider dashboard to verify whether unauthorized requests occurred during exposure.
