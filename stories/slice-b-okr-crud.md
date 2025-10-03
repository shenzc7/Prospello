# Story — Slice B: OKR CRUD + Alignment

Scope: Objective → 1–5 KRs (weights sum 100), optional Initiatives, parent/child alignment; calcProgress = Σ(KR.percent × weight/100).

## Routes (UI/API)
- UI: `/objectives` (list), `/objectives/new`, `/objectives/[id]` (detail), `/objectives/[id]/edit`.
- API:
  - Objectives: `GET/POST /api/objectives`, `GET/PATCH/DELETE /api/objectives/:id`, `GET /api/objectives/:id/tree` (parent+children).
  - Key Results: `POST /api/objectives/:id/key-results`, `PATCH/DELETE /api/key-results/:id`.
  - Initiatives: `POST /api/key-results/:id/initiatives`, `PATCH/DELETE /api/initiatives/:id`.

## Forms (RHF + Zod)
- ObjectiveForm: title (string), description? (string), cycle (enum/quarter string), startAt (date), endAt (date), owner (current by default), parentObjectiveId? (select), KRs[] (1–5).
- KRForm (inline, repeatable 1–5): title (string), weight (int 0–100), target (number > 0), current (number ≥ 0), unit? (string). KR.percent is derived = clamp((current/target)×100, 0..100).
- InitiativeForm (under KR): title (string), status (TODO/DOING/DONE).

## Validation (server + client)
- Objective: title required; startAt < endAt; 1–5 KRs required on create; parentObjectiveId ≠ self; prevent cycles; if parent set, cycle must match parent’s cycle (or reject).
- KR: title required; weight integer 0–100; Σ(weights) must equal 100; target > 0; current ≥ 0.
- Initiative: title required; status in enum.
- Permissions: owner can edit own objectives; manager/admin can edit team/company (enforce on API).

## Calculations
- KR.percent = clamp((current/target)×100, 0..100).
- Objective.progress = Σ(KR.percent × weight/100). Stored as derived field on read; recalculated on KR change.

## Acceptance (Given/When/Then)
1) Create Objective (valid)
- Given I open `/objectives/new` and enter an objective with 3 KRs where weights sum to 100
- When I submit
- Then I see the objective detail with progress computed per formula

2) Weights must sum 100
- Given the new objective form with KRs whose weights sum ≠ 100
- When I submit
- Then I see a validation error and the objective is not created

3) KRs count limits
- Given the new objective form
- When I try to add a 6th KR or remove to 0 KRs
- Then the UI blocks the action and shows an error

4) Update KR recalculates progress
- Given an objective with target/current values
- When I change a KR.current
- Then the objective progress updates to Σ(KR.percent × weight/100)

5) Parent/child alignment
- Given two objectives in the same cycle
- When I set one as the parent of the other
- Then the child shows its parent on detail and the parent’s tree lists the child

6) Initiatives under KR
- Given a KR on an objective
- When I add an initiative and mark it DONE
- Then it appears under the KR with updated status

7) Parent cycle mismatch rejected
- Given objectives from different cycles
- When I try to align child to parent
- Then the API returns a validation error
