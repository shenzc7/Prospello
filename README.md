# Prospello

Modern OKR and weekly check-in workspace built on Next.js 14 with Prisma, NextAuth, and shadcn/ui.

## Getting Started
1. Install dependencies: `npm install`
2. Configure environment: copy `.env.example` to `.env` and fill values.

### Runbook
- `npx prisma migrate dev` — apply latest schema to your local database.
- `npm run db:seed` — load demo users, objectives, and key results.
- `npm run dev` — start the application at `http://localhost:3000`.

### Branding
- `NEXT_PUBLIC_BRAND_NAME` — app display name (default: Prospello)
- `NEXT_PUBLIC_BRAND_TAGLINE` — short tagline for the login page
- `NEXT_PUBLIC_BRAND_LOGO_URL` — optional absolute URL for the brand logo image (falls back to an icon)

### Demo Accounts (after seeding)
- Admin: `admin@okrflow.test` / `Pass@123`
- Manager: `manager@okrflow.test` / `Pass@123`
- Meena: `me@okrflow.test` / `Pass@123`

### Demo Script
1. Sign in as `admin@okrflow.test`.
2. Open `/board` from the address bar.
3. Drag an objective between status columns and watch the board refresh live.
4. Filter by an Indian fiscal quarter, then open “Grow MRR to ₹50L” to view ₹-formatted pipeline targets.

## Deployment
Deploy on Vercel with the same environment variables; set `DATABASE_URL` to a managed Postgres instance and run `prisma migrate deploy` during the build step.
