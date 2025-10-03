# Story — Slice A: Auth + RBAC

Scope: NextAuth (Credentials), Org/User/Role, /admin guard, /admin/users table, seed 3 users.

References
- docs/OKRFlow-PRD.md — Product flows for auth/admin
- docs/ASSIGNMENT-SCOPE.md — Scope boundaries for Slice A
- docs/ANTI-AI-SMELL.md — Criteria for specificity and testability

## File Paths
- `app/api/auth/[...nextauth]/route.ts` — Credentials provider, Prisma adapter, session includes `role`, `orgId`.
- `middleware.ts` — Protects `(app)` routes; RBAC gate for `/admin`.
- `app/(auth)/login/page.tsx` — Login screen (RHF+Zod).
- `components/auth/LoginForm.tsx` — `data-testid` inputs/buttons.
- `app/(app)/admin/page.tsx` — Admin landing (requires `ADMIN`).
- `app/(app)/admin/users/page.tsx` — Users table (shadcn table).
- `app/api/admin/users/route.ts` — `GET` list users (ADMIN only).
- `app/api/admin/users/[id]/route.ts` — `PATCH` role changes (ADMIN only).
- `lib/auth.ts` — Credentials verify (bcrypt compare), session helpers.
- `lib/rbac.ts` — Role checks, route policy map.
- `prisma/schema.prisma` — Models/enum (see deltas).
- `prisma/seed.ts` — Seed org + 3 users (from docs).

## Prisma Deltas
- `enum Role { ADMIN, MANAGER, EMPLOYEE }`
- `model Organization { id String @id @default(cuid()) name String users User[] createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }`
- `model User { id String @id @default(cuid()) email String @unique name String? role Role @default(EMPLOYEE) passwordHash String orgId String? org Organization? @relation(fields: [orgId], references: [id]) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }`
- Include NextAuth models: `Session`, `Account`, `VerificationToken` (standard schema).
- Indexes: `@@index([role])`, `@@index([orgId])` on `User`.

Assumptions
- Single-tenant UI; `Organization` exists for future multi-tenant needs (PRD alignment).
- Credentials-only auth in Slice A; no OAuth/SSO.
- No invites/reset-password flows in this slice.

## Routes
- UI: `GET /login`, `GET /admin`, `GET /admin/users` (ADMIN only).
- API: `GET/POST /api/auth/[...nextauth]`; `GET /api/admin/users`; `PATCH /api/admin/users/:id`.
- Guards: `middleware.ts` redirects unauth → `/login`; non-admin from `/admin*` → `/`.

Out of Scope
- OAuth/SSO providers, email verification, password reset.
- Org switching UI, org admin screens.
- User create/delete; only role changes for existing users.

## UI Contract (Test IDs)
- Login: `login-email`, `login-password`, `login-submit`, `login-error`.
- Navbar: `nav-admin-link` (visible only for ADMIN).
- Admin Users: `admin-users-table`, `admin-users-search`, `admin-users-row-<id>`, `admin-users-email-<id>`, `admin-users-role-<id>`, `admin-users-save-<id>`.
- Toasts/alerts: `alert-success`, `alert-error`.

## Acceptance Tests (Given/When/Then)
1) Credentials Login — success
- Given seeded `admin@okrflow.test / Pass@123`
- When I fill `login-email`, `login-password` and click `login-submit`
- Then I see `/dashboard` and `nav-admin-link` is visible

2) Credentials Login — failure
- Given the login page
- When I submit valid email with wrong password
- Then I see `login-error` and remain on `/login`

3) RBAC — unauth redirect
- Given I visit `/admin/users` while logged out
- When the page loads
- Then I am redirected to `/login`

4) RBAC — non-admin blocked
- Given I am logged in as `manager@okrflow.test`
- When I navigate to `/admin`
- Then I am redirected to `/` and `nav-admin-link` is hidden

5) Admin Users table — list
- Given I am logged in as admin
- When I open `/admin/users`
- Then I see `admin-users-table` with rows for the 3 seeded users

6) Admin Users table — search
- Given `/admin/users` is open
- When I type `manager@okrflow.test` in `admin-users-search`
- Then only row with `admin-users-email-<managerId>` remains

7) Admin Users table — change role
- Given `/admin/users` is open
- When I select `ADMIN` in `admin-users-role-<employeeId>` and click `admin-users-save-<employeeId>`
- Then a `PATCH /api/admin/users/<employeeId>` returns 200 and I see `alert-success`

8) Session persistence — refresh
- Given I am logged in as admin on `/admin`
- When I refresh the page
- Then I remain on `/admin` and `nav-admin-link` is visible

9) Logout
- Given I am logged in
- When I click `nav-logout`
- Then I am redirected to `/login` and subsequent `/admin` visit redirects to `/login`

## Seed Data
- Organization: `Acme Corp` (default).
- Users: `admin@okrflow.test (ADMIN)`, `manager@okrflow.test (MANAGER)`, `me@okrflow.test (EMPLOYEE)` with password `Pass@123` (bcrypt-hashed).

Success Criteria
- All acceptance tests pass with the specified test IDs.
- Admin access strictly limited to `Role.ADMIN` on `/admin*`.
- Seed script creates exactly 3 users and one organization.
