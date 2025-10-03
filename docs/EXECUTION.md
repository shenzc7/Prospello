# Execution Plan

## Goals
- M0: NextAuth (Credentials), RBAC (Admin/Manager/Employee), Prisma schema + seed, Postgres; deploy.
- M1: OKR CRUD + alignment; auto progress = weighted KR%.
- M2: Weekly check-ins (KR updates, G/Y/R, comments).

## Non-Goals (this week)
- SSO (Google/Slack), notifications, exports.
- Advanced analytics/reports, alignment visualization.
- Pixel-perfect dashboards, perf hardening, mobile polish.

## Risks & Mitigations
- Auth/RBAC correctness → limit to credentials, role guards, tests.
- Data model complexity (alignment, weights) → simple schema; calc helper + unit tests.
- Deployment friction (DB/env) → single Postgres, .env.example, minimal config.
- Time/scope creep → lock M0/M1 first; M2 only if time.

## Plan
**A) Auth + RBAC**
- Credentials login, hashed passwords, seeded roles; middleware route protection; NextAuth session.

**B) OKR CRUD + Alignment**
- Models: Objective, KeyResult (weight, current/target), Initiative; parent/child objective relation. Derived objective progress. TanStack Query APIs; RHF+Zod forms.

**C) Weekly Check-ins**
- KR updates + status enum; comments; list/create endpoints; surface due check-ins on dashboard.

## Deliverables
- Deployed URL; seeded creds (admin/manager/employee).
- Repo: README (≤3 cmds), .env.example, prisma/seed.ts, light tests, docs/Decisions.md.

