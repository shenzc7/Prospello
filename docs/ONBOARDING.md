# Onboarding Playbook

This guide walks a new engineer or administrator through the exact steps required to take over the OKRFlow codebase and bring new organizations online without guesswork.

## 1. Developer Environment Handoff

1. **Clone & Install**  
   ```bash
   git clone <repo-url>
   cd Prospello
   npm ci
   ```
2. **Copy Environment Template**  
   ```bash
   cp env.example .env.local
   ```
   - Fill in database, SMTP, and OAuth secrets for your environment only.  
   - Production secrets are stored outside of git; never commit `.env*` files.
3. **Start Local Database** – either run Postgres via Docker or connect to your existing cluster. The schema lives in `prisma/schema.prisma`.
4. **Run Migrations & Seed Accounts**  
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```
   The seed script provisions three test accounts (admin/manager/employee) with passwords `Pass@123` inside the `GlobalTech International` org.
5. **Launch the App**  
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` and log in as `admin@globaltech.dev` to verify the dashboard, admin console, OKR board, and reports load successfully.

## 2. Administrator Flow (Single Owner → Invite Everyone Else)

1. **Log in as the seeded admin** (`admin@globaltech.dev`) and immediately set a unique password via the profile settings view (`/app/(app)/settings`).
2. **Configure Organization Settings** under `/app/(app)/admin`:
   - Update company name, slug, and domains to match the real organization.
   - Toggle feature flags in `config/features.ts` or use environment overrides.
3. **Optional – Connect SSO Before Inviting Users**
   - Add OAuth credentials (`GOOGLE_CLIENT_ID`, `AZURE_AD_CLIENT_ID`, etc.) to `.env.local` or Vercel project secrets.
   - Restart the server; the login screen automatically shows SSO buttons defined in `components/auth/SsoButtons.tsx`.
4. **Invite New Members**
   - Go to **Admin → Invitations**. Each invite issues a signed token via `app/api/invitations/route.ts` and emails a signup URL.
   - Ensure `SMTP_*` variables are set; otherwise copy the invite link manually.
5. **Assign Roles & Teams**
   - Use **Admin → Users** to grant `ADMIN`, `MANAGER`, or `EMPLOYEE` roles. Only admins can create more admins.
   - Create teams in **Teams** and attach users. Team membership drives OKR ownership and check-in routing.
6. **Verify Check-in Cadence**
   - Background cron endpoints live in `/app/api/cron/*`. Configure `CRON_SECRET` and schedule jobs (see `vercel.json`).
   - Use the `/app/(app)/alerts` view to verify reminders, traffic-light statuses, and notification feeds.

## 3. Production Cutover Checklist

1. **Environment Secrets** – Populate `vercel env` (or your secret manager) with every key listed in `env.example`. Double-check `NEXTAUTH_URL` and `DATABASE_URL`.
2. **Database State**
   - `npx prisma migrate deploy` to apply schema.
   - `npm run db:seed` (optional) to provision the baseline admin; otherwise create the admin manually through `prisma.user.create`.
3. **Background Jobs** – Confirm Vercel Cron or your scheduler hits `/api/cron/reminders` and `/api/cron/scoring` with the `x-cron-secret` header.
4. **Smoke Tests**
   - `npm run lint`, `npm run test`, and `npx playwright test` should all pass locally before deployment.
   - Use `/app/api/health` once deployed to ensure DB + email integrations respond.
5. **Access Handover**
   - Delete the default manager/employee accounts in production once the real staff is created.
   - Store admin recovery credentials in your password manager. No other default logins exist after this step.

## 4. Where To Go Next

- **Feature Development** – Business logic lives under `lib/` and UI components under `components/` following the structure documented in `README.md`.
- **API Contracts** – See `docs/API.md` for REST contracts.
- **Deployment Steps** – Use `docs/VERCEL_DEPLOYMENT.md` for an end-to-end launch guide.

Following these steps ensures a single administrator bootstraps the tenant and that every additional user enters through the controlled invitation workflow.
