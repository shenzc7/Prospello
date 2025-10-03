# Story — Slices B & C: OKRs CRUD + Weekly Check-Ins

Scope: Implement Objective/KR/Initiative lifecycle and weekly CheckIns with “My OKRs” quick-update view (aligned with docs/OKRFlow-PRD.md and docs/ASSIGNMENT-SCOPE.md).

## File Paths & Routes
- `app/(app)/okrs/page.tsx` — Objectives list (`GET /okrs`).
- `app/(app)/okrs/new/page.tsx` — Objective creation form.
- `app/(app)/okrs/[id]/page.tsx` — Objective detail, includes KR list + history.
- `app/(app)/my-okrs/page.tsx` — Quick weekly update view for signed-in user.
- `components/objectives/{ObjectiveForm,KeyResultFields,InitiativesSection}.tsx` — RHF forms.
- `components/check-ins/{QuickCheckInRow,HistoryPanel,StatusChip}.tsx` — Check-in UI primitives.
- `hooks/{useObjectives,useObjective,useMyOkrs}.ts` — TanStack Query data hooks.
- `app/api/objectives/route.ts` — `GET/POST` Objectives.
- `app/api/objectives/[id]/route.ts` — `GET/PATCH/DELETE` Objective + nested relations.
- `app/api/objectives/[id]/key-results/route.ts` — Bulk replace KRs.
- `app/api/initiatives/[id]/route.ts`, `app/api/key-results/[id]/initiatives/route.ts` — Initiative CRUD.
- `app/api/check-ins/route.ts` — `GET` history, `POST` weekly upsert.

## Prisma Deltas (Objective/KR/Initiative/CheckIn)
- `model Objective`:
  - Fields: `id`, `title`, `description?`, `cycle`, `startAt`, `endAt`, `ownerId -> User`, `parentId? -> Objective`, timestamps.
  - Relations: `keyResults KeyResult[]`, `children Objective[] @relation("ObjectiveHierarchy")`.
  - Constraints: `@@index([ownerId, cycle])`, parent cycle must match child (validated in service layer).
- `model KeyResult`:
  - Fields: `id`, `objectiveId`, `title`, `weight Int` (0–100), `target Float >0`, `current Float >=0`, `unit?`.
  - Relations: `objective Objective @relation(fields: [objectiveId])`, `initiatives Initiative[]`, `checkIns CheckIn[]`.
  - Constraints: enforce Σ(weights)=100 per objective in app logic.
- `model Initiative`:
  - Fields: `id`, `keyResultId`, `title`, `status` enum `{TODO, DOING, DONE}`.
  - Constraint: `@@index([keyResultId])`.
- `model CheckIn`:
  - Fields: `id`, `keyResultId`, `userId`, `weekStart DateTime` (ISO week Monday 00:00 UTC), `value Float >=0`, `status` enum `{GREEN,YELLOW,RED}`, `comment?`, timestamps.
  - Constraint: `@@unique([keyResultId, userId, weekStart])`.
  - Side-effects: After upsert, propagate `KeyResult.current = value`; objective progress recalculated using KR weights (server layer).

## API Surface (CRUD + Check-Ins)
- Objectives
  - `GET /api/objectives?search=&cycle=&ownerId=&limit=&offset=` — paginated list, role-guarded.
  - `POST /api/objectives` — create with 1–5 KRs (weights sum 100), optional parent alignment.
  - `GET /api/objectives/:id` — detail with derived progress (`calcProgress = Σ(KR.percent × weight/100)`).
  - `PATCH /api/objectives/:id` — update metadata + replace KRs (weights validated) + initiatives diff.
  - `DELETE /api/objectives/:id` — remove objective and dependents (authz per owner/manager/admin).
  - `POST /api/objectives/:id/key-results` — bulk replace KRs while enforcing weight/target rules.
  - `POST /api/key-results/:id/initiatives` & `PATCH/DELETE /api/initiatives/:id` — manage initiatives tied to KR.
- Check-Ins
  - `GET /api/check-ins?keyResultId=&from=&to=&userId=` — list weekly entries (owner sees own; managers/admins may query team).
  - `POST /api/check-ins` — upsert weekly entry (`{ keyResultId, value, status, comment?, weekStart? }`); server derives userId + ISO week.

## UI Pages & Contracts
- `/okrs` (list)
  - Table of objectives with progress bars, KR count, child count.
  - CTA `okrs-new-button` to create objective.
  - Filters: search (`okrs-search-input`), cycle (`okrs-cycle-select`).
- `/okrs/new`
  - `ObjectiveForm` with fields: `objective-title`, `objective-cycle`, `objective-startAt`, `objective-endAt`, `objective-parent`, `objective-description`.
  - KR sub-forms (1–5) with inputs `kr-title-<index>`, `kr-weight-<index>`, `kr-target-<index>`, `kr-current-<index>`, `kr-unit-<index>`.
  - Initiatives optional rows `initiative-title-<krId>-<index>`.
  - Submit `objective-save`.
- `/okrs/[id]`
  - Detail header `okrs-detail-title`, progress badge `okrs-progress`.
  - KR cards with meters `kr-progress-<id>`, weight display, current vs target.
  - Initiatives list `kr-initiatives-<id>` with status tags.
  - History toggle per KR `kr-history-toggle-<id>` linking to check-in timeline.
- `/my-okrs`
  - Root `my-okrs-page` showing objectives owned by current user in active cycle.
  - For each KR: quick row with inputs `my-okrs-value-<krId>`, `my-okrs-status-<krId>`, `my-okrs-comment-<krId>`, submit `my-okrs-save-<krId>`.
  - Status chip `status-chip-<krId>` reflecting selection, success/error alerts `alert-success` / `alert-error`.
  - History panel `kr-history-<krId>` (lazy load).

## Acceptance Tests (Given/When/Then)
1) Create objective with valid KRs
- Given I open `/okrs/new` as an authenticated owner
- When I fill `objective-title`, add 3 KRs with weights 40/40/20 (inputs `kr-weight-0..2`) and click `objective-save`
- Then I land on `/okrs/<newId>` with `okrs-detail-title` showing the name and `okrs-progress` computed via Σ(KR.percent × weight/100)

2) KR weight validation
- Given `/okrs/new` with 2 KRs where `kr-weight-0=60`, `kr-weight-1=30`
- When I submit
- Then form shows validation near `kr-weight-group` and no objective is created

3) Parent alignment cycle check
- Given an existing parent objective in cycle “Q1 2025”
- When I create a child in `/okrs/new` selecting that parent while setting cycle “Q2 2025”
- Then API responds 400 and UI shows error banner `objective-error`

4) Update KR recalculates progress
- Given `/okrs/<id>` has KR `kr-progress-<krId>` at 50%
- When I edit the objective to change `kr-current-<index>` via edit form
- Then `okrs-progress` updates to the new Σ formula and `kr-progress-<krId>` reflects the recalculated percentage

5) Manage initiatives inline
- Given `/okrs/<id>` with KR `kr-initiatives-<krId>`
- When I add a new initiative via `initiative-title-<krId>-new` and save
- Then the initiative list shows the new entry with status tag and persists after refresh

6) Weekly check-in creation
- Given `/my-okrs` and KR `my-okrs-kr-<krId>` has no entry for this week
- When I set `my-okrs-value-<krId>`=42, choose `my-okrs-status-<krId>`=GREEN, add comment, and click `my-okrs-save-<krId>`
- Then `alert-success` appears, `status-chip-<krId>` reads “On Track”, and `/api/check-ins` stores `(krId, userId, weekStart)`

7) Weekly check-in idempotency
- Given a check-in already exists for `(krId, userId, weekStart)`
- When I submit new values via the same quick row
- Then the response is success, the previous row updates, and history shows a single entry for that week with latest values

8) History visibility and permissions
- Given I am objective owner viewing `/okrs/<id>`
- When I toggle `kr-history-toggle-<krId>`
- Then `kr-history-<krId>` lists entries in reverse week order with value, comment, and `status-chip` per entry
- And if a different non-manager user attempts `GET /api/check-ins?keyResultId=<krId>&userId=other`, the response is 403

9) My OKRs filter
- Given `/my-okrs` is loaded for user A
- When objectives exist for user A and user B
- Then only sections `my-okrs-objective-<objId>` belonging to user A render and `my-okrs-objective-<objB>` is absent

