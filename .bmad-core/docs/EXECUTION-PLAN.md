# Execution Plan (OKRFlow)

## Slices
A) **Auth + RBAC** → login, roles, /admin guard, seed users.  
B) **OKR CRUD + Alignment** → Objectives, KRs (weights), Initiatives, progress util.  
C) **Weekly Check-ins** → KR value updates, status chips (G/Y/R), comments.

## Acceptance Gates
- A: 3 users can log in; `/admin` guarded; 1 unit + 1 e2e pass.
- B: Create/edit objective with KRs; progress auto-updates; RBAC enforced.
- C: Check-in history persists; status chips correct.

## Deploy
Vercel with envs; DB on Neon/Supabase. Share URLs + creds Friday night.