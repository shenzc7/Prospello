# Story — Slice C: Check-ins + “My OKRs” Quick Update

Scope: Weekly check-ins on Key Results with status (G/Y/R), value, and optional comment by the signed-in user; a “My OKRs” view for fast, in-context updates. No code in this story.

## Prisma Deltas
- Model `CheckIn` enrichments (keeping existing fields):
  - `weekStart DateTime` — Monday 00:00:00 UTC of the ISO week for the check-in.
  - Uniqueness: `@@unique([keyResultId, userId, weekStart])` to allow max one check-in per KR/user/week.
- Invariants:
  - `status` in `{GREEN, YELLOW, RED}` aligns with enum `CheckInStatus`.
  - `value >= 0` (validated at API/form level).
  - `weekStart = startOfISOWeek(at)` if not provided by client.
- Side-effect on KR: On upsert of a check-in, set `KeyResult.current = value` and recompute objective progress (per Slice B).

## Routes (UI/API)
- UI
  - `GET /my-okrs` — “My OKRs” quick update. Lists current user’s Objectives (active cycle) and their KRs with inline check-in form for the current week.
  - `GET /objectives/[id]` — Detail shows historical check-ins per KR (read-only timeline, optional in Slice C if already present from Slice B).
- API
  - `GET /api/my/okrs` — Returns current user’s active-cycle objectives with KRs (id, title, target, current, unit, last check-in for current week if any).
  - `GET /api/check-ins?keyResultId=...&from=...&to=...` — List check-ins for graphs/history (optional for Slice C; minimally current week fetch).
  - `POST /api/check-ins` — Create or update a check-in for the current user. Body: `{ keyResultId: string, value: number, status: 'GREEN'|'YELLOW'|'RED', comment?: string, weekStart?: string(ISO) }`. Upsert on `(keyResultId,userId,weekStart)`.

## Forms (RHF + Zod)
- QuickCheckInForm (inline per KR on /my-okrs):
  - Fields: `value (number >= 0)`, `status (enum)`, `comment? (string ≤ 500)`.
  - Hidden/derived: `keyResultId`, `weekStart` (default server-calculated), `userId` from session.
  - Submit `POST /api/check-ins`; optimistic UI updates `KR.current` and recalculated percent/progress.

## Validation & Rules
- AuthZ: Only the signed-in user can create/update their own check-ins via `/api/check-ins` (ignore `userId` from client; infer from session).
- Limits: 1 check-in per KR per week per user enforced by unique index. Subsequent submit is an update.
- Boundaries: `value >= 0`; `status ∈ {GREEN,YELLOW,RED}`; `comment ≤ 500 chars`.
- Data integrity: Updating a check-in updates `KeyResult.current` to the new `value`; objective progress recalculates (Σ(KR.percent × weight/100)).
- Visibility: `/my-okrs` lists only objectives where `ownerId = session.user.id` for the active cycle (current date ∈ [startAt, endAt]).

## UI Contract (Test IDs)
- “My OKRs”
  - Page/root: `my-okrs-page`
  - Objective section: `my-okrs-objective-<objectiveId>`
  - KR row: `my-okrs-kr-<keyResultId>`
  - Fields: `my-okrs-value-<keyResultId>`, `my-okrs-status-<keyResultId>`, `my-okrs-comment-<keyResultId>`
  - Submit: `my-okrs-save-<keyResultId>`
  - Feedback: `alert-success`, `alert-error`
- History (optional): `kr-history-<keyResultId>`

## Acceptance (Given/When/Then)
1) List my active OKRs
- Given I am logged in and have objectives whose cycles include today
- When I visit `/my-okrs`
- Then I see each objective and its KRs with current values and an inline check-in form per KR

2) Create my weekly check-in (first of week)
- Given `/my-okrs` is open and KR A shows no check-in for this week
- When I enter a value, pick status `GREEN`, and click `my-okrs-save-<A>`
- Then the request `POST /api/check-ins` upserts a record for `(A, me, weekStart)` and I see `alert-success`
- And the KR row updates to show the new value and recalculated percent/progress

3) Update my weekly check-in (idempotent per week)
- Given KR A already has a check-in this week
- When I change the value/status/comment and click save
- Then the upsert updates the existing check-in and I see `alert-success`
- And KR.current reflects the new value

4) Prevent duplicate check-ins
- Given I submit twice in quick succession for the same KR within the same week
- When the second request reaches the server
- Then the unique constraint on `(keyResultId,userId,weekStart)` is respected and the operation is treated as an update, not a second insert

5) Validation: non-negative value
- Given I enter a negative value for a KR
- When I submit
- Then I see `alert-error` and the check-in is not saved

6) Authorization: only self
- Given I craft a request with a different `userId`
- When I hit `POST /api/check-ins`
- Then the API ignores the provided `userId`, uses the session user, and returns 200 only if I am authenticated

7) Visibility: only my KRs
- Given I am on `/my-okrs`
- When the list renders
- Then it only includes objectives where I am the owner and does not include other users’ objectives

8) Historical view (optional)
- Given I open an objective detail
- When I expand a KR history section
- Then I see past check-ins with week, value, status, and comment in reverse chronological order

## Out of Scope (Slice C)
- Team/manager check-in entry on behalf of others.
- Bulk import/export of check-ins.
- Analytics dashboards beyond per-objective progress recalculation.

## Success Criteria
- One check-in per KR per week per user via unique index.
- “My OKRs” renders only current user’s active-cycle objectives/KRs and supports quick inline updates.
- KR.current and objective progress recalculate immediately after a successful check-in upsert.
