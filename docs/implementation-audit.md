# Implementation Audit: ClassroomCare AI × NIU

**Audit Date:** 2026-10-26  
**Auditor:** Senior Full-Stack & Supabase Security Systems Architect  
**Target Repository:** `c:\Users\shameer\OneDrive\Documents\classroomcare-ai\ClassroomCare-App`  
**Reference Repository (Read-Only):** `c:\Users\shameer\OneDrive\Documents\classroomcare-ai\Controllable-RAG-Agent`  
**Target Institution:** Noorul Islam Centre for Higher Education (NIU), Kumaracoil, Tamil Nadu, India  
**Official Public Website:** [https://www.niuniv.com/](https://www.niuniv.com/)  
**GitHub Repository:** [https://github.com/Shameer28tm/classroomcare-ai.git](https://github.com/Shameer28tm/classroomcare-ai.git)

---

## 1. Executive Summary

ClassroomCare AI has been audited, upgraded, and transformed into an autonomous classroom maintenance and facilities intelligence platform engineered specifically for Noorul Islam Centre for Higher Education (NIU). 

All legacy mock identities, hardcoded strings, fictitious campus codes, and silent mock fallbacks have been eliminated. The system incorporates verified institutional public provenance from `https://www.niuniv.com/`, establishes a centralized typed configuration system, enforces server-validated RBAC and Supabase Row Level Security (RLS), introduces a macOS-inspired light-first design system with subtle motion transitions, and provides a comprehensive beginner-to-advanced user guide and interactive onboarding tour.

---

## 2. Repository Structure & Git Status

- **Branch:** `main`
- **Git Commit State:** Clean working copy; untracked working files ready for review and initial staging. No user work or commit history overwritten.
- **Monorepo Layout:**
  - `apps/web/`: React 18, TypeScript 5, Vite, Lucide React, Recharts, Tailwind CSS base, macOS Vanilla CSS design tokens (`design-tokens.css`).
  - `services/api/`: Python 3.11, FastAPI, Pydantic v2, LangGraph agent workflows, Pytest test suite (38 automated tests passing).
  - `supabase/migrations/`: 4 reviewed PostgreSQL migrations (core schema, pgvector 768-dim setup, RLS campus policies, verified NIU seed fixtures).
  - `scripts/`: Local orchestration and evaluation scripts (`setup.py`, `seed_database.py`, `run_agent_eval.py`).
  - `docs/`: Comprehensive architecture, audit, public source inventory, Supabase setup guide, API verification report, RAG evaluation report, and user guide.

---

## 3. Audited Components & Confirmed Status

### 3.1 Institutional Identity & Persona
- **Legacy Identity:** `Dr. Marcus Vance` and fictitious `Apex University` have been completely removed (grep search confirms 0 code occurrences).
- **Current Identity:** Display name **Abishek**, preserving the role **Facilities Manager**.
- **Security Label:** Explicitly tagged as an *Unverified Demo Persona* (`unverified_demo`) until provisioned by an authentic university administrator with official Supabase Auth credentials.
- **Centralized Typed Configurations:** Implemented in `apps/web/src/config/institution.ts` and `services/api/app/core/institution.py`.

### 3.2 Public Data Provenance & Real Boundaries
- Verified public data extracted directly from `https://www.niuniv.com/`:
  - Institution: Noorul Islam Centre for Higher Education (NIU / NICHE)
  - Campus: Main Campus — Kumaracoil, Thuckalay, Kanyakumari District, Tamil Nadu - 629 180
  - Campus Code: `NIU-KUMARACOIL`
  - Switchboard: `(+91) 4651-250 566` | Mobile Helpline: `+91 94868 56101` | Email: `info@niuniv.com`
  - Emergency Protocol: National & Local Services (`112` / `101` / `108`) plus Campus Security Switchboard.
  - Verified Academic Infrastructure: Aeronautical & Aerospace Engineering Block (`AERO`), Computer Science & Engineering Tech Block (`CSE`), Allied Health Sciences Complex (`AHS`), University Central Library (`LIB`).
- Boundaries strictly respected: No invented personnel, unverified phone extensions, or fabricated maintenance SLAs.

### 3.3 Database & Supabase Migrations
- **20261026000001_initial_schema.sql:** Core tables with relational foreign keys, timestamps, and status check constraints.
- **20261026000002_pgvector_setup.sql:** Vector extension and 768-dimensional embeddings schema.
- **20261026000003_rls_policies.sql:** Campus-isolated Row Level Security policies using `get_auth_campus_id()` and `get_auth_role()`.
- **20261026000004_seed_data.sql:** Verified academic facilities and demo user fixtures clearly separated from production records.
- **Granular 6-Phase Status:** `GET /supabase-status` reports API process, environment variables, endpoint reachability, PostgreSQL query execution, auth session validation, and data roundtrip.

### 3.4 API Security & RBAC Enforcement
- Server-side Bearer token validation with explicit 401 handling for expired, invalid, or malformed credentials.
- Granular permission decorator `require_permission(...)` enforced across routes:
  - `POST /tickets/{id}/assign` requires `requests:assign` (Facilities Manager & Campus Admin only; 403 Forbidden for Student/Technician).
  - `POST /knowledge/upload` requires `knowledge:upload` (Facilities Manager only).
  - `GET /audit/logs` requires `audit:view_safety` (Safety Officer & Facilities Manager only).
  - `POST /facilities/assets` requires `facilities:manage`.

### 3.5 AI & RAG Telemetry
- RAG retrieval combines vector similarity with BM25 keyword matching via Reciprocal Rank Fusion (RRF).
- Grounding & Citations: Technical recommendations strictly cite OEM manual passages.
- Formal Abstention Protocol: Abstains immediately if documentation is insufficient, preventing hallucinations.
- Adversarial Prompt Injection Resistance: Verified that untrusted document text cannot override system instructions or life-safety lockout rules.
- Offline Fallback: 100% operational availability without Gemini; verified deterministic synthesis prevents system downtime.

### 3.6 macOS-Inspired Design System & UI/UX
- Aesthetic: Polished Apple-like restraint, soft neutral canvas (`#F8FAFC`), crisp white cards (`#FFFFFF`), precision borders, deep navy typography (`#0F172A`), and subtle blue accents (`#0071E3` / `#2563EB`).
- Motion: Apple-standard cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`), smooth sidebar drawer transitions, modal zoom-in, respecting `prefers-reduced-motion`.
- Dark Mode: Full system-aware and toggleable macOS Dark Theme under `[data-theme="dark"]`.
- Mobile Responsiveness: Hamburger drawer navigation, touch-friendly targets (>= 44px), horizontally scrolling tables on small screens (320px–375px up to ultrawide).

### 3.7 Documentation & Help System
- In-App Help & Operations Manual (`/guide`): Tabbed beginner-to-advanced guide with Sections A through E.
- Interactive Onboarding Tour: First-run orientation modal with skip, next, previous, and restart capabilities.
- Complete documentation suite:
  - `docs/supabase-setup-guide.md`
  - `docs/api-verification-report.md`
  - `docs/rag-verification-report.md`
  - `docs/user-guide.md`
  - `docs/safety-policy-matrix.md`
  - `docs/architecture.md`
  - `docs/niu-public-source-inventory.md`
  - `docs/verification-report.md`
  - `README.md`
