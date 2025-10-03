# Architectural Decisions

- **RBAC Model** — Roles (`ADMIN`, `MANAGER`, `EMPLOYEE`) gate OKR visibility and mutations; only managers/admins can view team objectives while edits default to the owner.
- **Progress Rule** — Objective progress derives from weighted KR percentages (`Σ(weight × KR%)`), keeping Prisma data normalized and UI consistent with the server calculation.
- **Alignment** — Objectives may nest under a parent only if their cycles match; validation happens in API routes before persisting Prisma mutations.
- **Error Policy** — API handlers return JSON `{ error, details? }` with appropriate HTTP codes, and client hooks surface messages via React Query error boundaries.
- **Test Scope** — Critical flows are covered through Storybook stories and integration specs under `tests-e2e`; unit tests focus on helpers in `lib/`.
- **Board View** — `/board` uses TanStack Query + dnd-kit to present objective status columns with server-driven progress, avoiding client-side state drift.
- **INR Formatting** — All financial metrics use `Intl.NumberFormat('en-IN', { currency: 'INR', style: 'currency' })` to match Indian rupee notation across UI surfaces.
- **India FY** — `getIndianFiscalQuarter` normalises OKRs to the April–March fiscal calendar and stamps Prisma rows for future reporting.
- **GST Template** — Compliance objectives include seeded GST copy and helper microcopy to anchor localisation narratives for India rollout.
- **Known Limits** — No optimistic updates on check-ins, weight validation stays client/server, UI copy is English-only, and GST filing remains a manual placeholder without API integration.
