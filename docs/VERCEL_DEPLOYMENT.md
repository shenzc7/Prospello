# Vercel Deployment Guide

Use this document as the authoritative checklist before pushing OKRFlow to production on Vercel.

## 1. Pre-flight Checklist

- ✅ Node 18.17+ and npm 9+ installed locally.
- ✅ `vercel` CLI authenticated (`vercel whoami`).
- ✅ Database reachable from Vercel with SSL enabled.
- ✅ All tests pass locally (`npm run verify`).
- ✅ Cron secret chosen (random, 32+ chars).

## 2. Configure Environment Variables

Vercel manages secrets per-environment. Run the following to populate production values:

```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add CRON_SECRET production
vercel env add SMTP_HOST production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
# ...continue for every entry in env.example
```

For bulk updates use:

```bash
vercel env pull .env.production.local   # fetch current values
# edit the file locally
vercel env push .env.production.local   # upload changes
rm .env.production.local                # remove the file afterwards
```

## 3. Database Preparation

1. Provision PostgreSQL (Vercel Postgres, Neon, RDS, etc.).
2. Update `DATABASE_URL` with SSL + pooling parameters.
3. Apply migrations and seed data:
   ```bash
   npx prisma migrate deploy
   npm run db:seed   # optional – creates the demo org + admin
   ```
4. If you seed production, immediately change the admin password and delete unused demo users.

## 4. Cron & Background Jobs

`vercel.json` ships two cron definitions:

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/reminders?orgId=all` | `0 9 * * *` | Daily reminders (Mon–Fri recommended) |
| `/api/cron/scoring?orgId=all`   | `0 */6 * * *` | Recalculates progress + risk |

Each cron call must include `x-cron-secret: $CRON_SECRET`. If you need additional jobs, mirror the pattern in `vercel.json`.

## 5. Deploy

```bash
./deploy.sh
```

The script performs:
1. `npm run verify`
2. `npx prisma migrate status`
3. `vercel pull --environment=production`
4. `vercel build --prod`
5. `vercel deploy --prebuilt --prod`

## 6. Post-deployment Validation

1. Hit `https://<app-domain>/api/health` – database/auth/email checks should return `healthy`.
2. Login as the admin and validate the dashboard, admin console, and OKR board load.
3. Trigger a manual cron call:
   ```bash
   curl -X POST https://<app-domain>/api/cron/reminders \
     -H "x-cron-secret: $CRON_SECRET"
   ```
4. Monitor Vercel logs for background jobs and API routes.
5. Remove any demo data left in production.

When each step passes, the codebase is officially production-ready on Vercel.
