# Contributing to ClassroomCare AI

Thank you for your interest in contributing to **ClassroomCare AI — NIU Facilities & Campus Operations**! This guide outlines our development workflow, coding standards, and verification requirements.

---

## 1. Development Principles

1. **Safety & Zero-Override:** Deterministic safety rules always take precedence over AI generative output. Never remove or loosen safety constraints on electrical, fire, or chemical hazard classifications.
2. **Real Data Boundaries:** Do not fabricate campus infrastructure, personnel, or emergency numbers. All institutional references must be verified from official public sources at [https://www.niuniv.com/](https://www.niuniv.com/).
3. **Secret Hygiene:** Never commit `.env` files, API keys, database passwords, or service-role keys. All configuration templates must use sanitized placeholders.
4. **Verified Testing:** Every pull request must pass the automated test suites without suppressed failures.

---

## 2. Local Setup Workflow

### Backend (Python 3.11+ / FastAPI):
```powershell
cd services/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend (React 18 / TypeScript / Vite):
```powershell
cd apps/web
npm install
```

---

## 3. Pre-Commit Verification Checklist

Before creating a commit or submitting a pull request, run all verification gates:

```powershell
# 1. Run Backend Pytest Suite (38 tests)
.\services\api\.venv\Scripts\python -m pytest

# 2. Run 10 Critical User Journeys Evaluation
.\services\api\.venv\Scripts\python scripts/run_agent_eval.py

# 3. Check Frontend Type-Safety & Production Build
cd apps/web
npm run build
```

---

## 4. Git Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` New user-facing feature or enhancement
- `fix:` Bug fix or security patch
- `docs:` Documentation additions or updates
- `style:` Formatting, CSS design tokens, or visual styling
- `refactor:` Code restructuring without behavior change
- `test:` Adding or updating tests
- `chore:` Dependency or tooling updates

Example:
```bash
git commit -m "feat(rag): enforce formal abstention on ungrounded technical queries"
```

---

## 5. Security & Secret Scanning

Before pushing:
1. Run `git status` to verify no `.env` or untracked temporary files are staged.
2. Inspect `git diff --staged` to confirm all secrets, tokens, and personal emails are absent.
3. If GitHub Push Protection detects a secret, never bypass the protection. Remediate the credential immediately.
