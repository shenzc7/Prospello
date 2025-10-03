# Slice Index — A) Auth+RBAC, B) OKR CRUD+Alignment, C) Weekly Check-ins

## A) Auth + RBAC
- Files
  - `app/api/auth/[...nextauth]/route.ts` (Credentials provider, PrismaAdapter)
  - `middleware.ts` (RBAC route guards)
  - `lib/auth.ts`, `lib/rbac.ts` (verify creds, role helpers)
  - `app/(auth)/login/page.tsx`, `components/auth/LoginForm.tsx` (RHF+Zod)
  - `prisma/schema.prisma`, `prisma/seed.ts` (seed 3 users per docs)
- Routes (UI/API)
  - `GET /login` | `POST/GET /api/auth/[...nextauth]`
  - Protected UI: `/dashboard`, `/objectives`, `/admin` (Admin-only)
- DB Models
  - `User { id, email, name?, role: ADMIN|MANAGER|EMPLOYEE, passwordHash }`
  - NextAuth tables: `Session`, `Account`, `VerificationToken`
- Acceptance Tests (Playwright)
  - Login succeeds for admin/manager/employee; persists session; logout works
  - RBAC: non-admin blocked from `/admin`; unauth → `/login`
  - Bad password shows error; rate-limited UI copy present

## B) OKR CRUD + Alignment
- Files
  - `app/(app)/objectives/page.tsx`, `[id]/page.tsx` (list/detail)
  - `app/api/objectives/route.ts`, `[id]/route.ts` (CRUD)
  - `app/api/objectives/[id]/key-results/route.ts`, `app/api/key-results/[id]/route.ts`
  - `components/objectives/{ObjectiveForm,KeyResultForm,ProgressBar}.tsx`
  - `lib/progress.ts` (weighted KR% calc), `lib/validators/{objective,keyresult}.ts`
  - `hooks/{useObjectives,useKeyResults}.ts` (TanStack Query)
- Routes (UI/API)
  - UI: `/objectives`, `/objectives/[id]`
  - API: `/api/objectives`, `/api/objectives/[id]`, `/api/objectives/[id]/key-results`, `/api/key-results/[id]`
- DB Models
  - `Objective { id, title, description?, ownerId -> User, cycle, startAt, endAt, parentId? -> Objective }`
  - `KeyResult { id, objectiveId -> Objective, title, weight (0–1), target:number, current:number, unit? }`
  - `Initiative { id, keyResultId -> KeyResult, title, status: TODO|DOING|DONE }`
- Acceptance Tests
  - Create Objective with 1–5 KRs (weights sum ≈ 1); validation errors otherwise
  - Update KR.current updates Objective progress (calc matches helper)
  - Set parent objective; alignment visible on detail; permissions respected

## C) Weekly Check-ins
- Files
  - `app/(app)/check-ins/page.tsx`, `components/check-ins/CheckInForm.tsx`
  - `app/api/check-ins/route.ts`, `[id]/route.ts`
  - `lib/validators/checkin.ts`
- Routes (UI/API)
  - UI: `/check-ins` and surfaced in `/objectives/[id]`
  - API: `/api/check-ins`, `/api/check-ins/[id]`, optional `/api/key-results/[id]/check-ins`
- DB Models
  - `CheckIn { id, keyResultId -> KeyResult, value:number, status:G|Y|R, comment?, at:Date, userId -> User }`
- Acceptance Tests
  - Create check-in updates KR.current and displays G/Y/R
  - List weekly check-ins per KR; only owner/manager can create; others view-only

- Tests (structure)
  - E2E: `tests/e2e/{auth,objectives,checkins}.spec.ts` (Playwright)
  - Unit: `tests/unit/progress.test.ts` (Vitest)
