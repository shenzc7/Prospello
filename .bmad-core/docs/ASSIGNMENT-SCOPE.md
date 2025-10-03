# Assignment Scope (from PRD)

## Must-Hit by Friday
- **M0 Baseline:** Auth via **NextAuth (Credentials)**, **RBAC** (Admin/Manager/Employee), **Prisma** schema + **seed**.
- **M1 Core:** **OKR CRUD + Alignment**  
  Objective → 1–5 KRs (weighted), optional Initiatives, parent/child alignment, **auto progress = weighted KR%**.
- **M2 Core (if time):** Weekly **Check-ins** (update KR values, G/Y/R, comments).

## Deliverables
1) **Deployed URL** (Vercel/Blender) with seeded creds:  
   - admin@okrflow.test / Pass@123  
   - manager@okrflow.test / Pass@123  
   - me@okrflow.test / Pass@123
2) **Repo** with: `README` (≤3 run cmds), `.env.example`, `prisma/seed.ts`, light tests, `docs/Decisions.md` (6 bullets: RBAC, calc rule, alignment, error policy, tests scope, limits).

> PRD source lives at: `docs/OKRFlow-PRD.md`