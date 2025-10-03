# Prospello

Modern OKR and weekly check-in workspace built on Next.js 15 with Prisma, NextAuth, and shadcn/ui.

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

## Database Setup with Prisma

### Quick Start:
```bash
# 1. Set up database URL in .env
DATABASE_URL="file:./dev.db"

# 2. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# 3. Seed with demo data
npm run db:seed
```

### Database Schema Overview:
- **SQLite database** for development (easily switchable to PostgreSQL for production)
- **NextAuth.js integration** with User, Account, Session models
- **OKR entities**: Organization → Teams → Objectives → Key Results → Initiatives
- **Check-ins**: Weekly progress tracking with status (GREEN/YELLOW/RED)
- **Role-based access**: ADMIN, MANAGER, EMPLOYEE permissions

### Key Relationships:
```
Organization
├── Users (with roles)
├── Teams
└── Objectives (owned by users, assigned to teams)

Objectives
├── Key Results (weighted progress tracking)
├── Initiatives (action items per KR)
└── Check-ins (weekly updates per KR)

Users can:
- Create/manage their objectives
- View team objectives (role-based)
- Submit weekly check-ins on key results
```

## Real-time Collaboration Setup

### Working from Any Device:
1. **Clone the repository:**
   ```bash
   git clone https://github.com/shenzc7/Prospello.git
   cd Prospello
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and auth credentials
   ```

4. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Start development:**
   ```bash
   npm run dev
   ```

### Sync Changes:
- **Push changes:** `git add . && git commit -m "Your changes" && git push`
- **Pull changes:** `git pull origin main`
- **Check status:** `git status` and `gh repo view Prospello`

## Database Monitoring & Debugging

### Prisma Query Logging:
```bash
# Enable query logging in .env.local
PRISMA_LOG_LEVEL="query"
PRISMA_LOG_QUERIES="true"

# Restart your dev server to see all database queries in terminal
npm run dev
```

### Prisma Studio (Database GUI):
```bash
# Open visual database browser
npx prisma studio

# Opens at http://localhost:5555 by default
# View/edit data, run queries, see schema relationships
```

### Database Commands:
```bash
# View current migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name "your-migration-name"

# View database schema
npx prisma db push --preview-feature
```

### Database Seed & Reset:
```bash
# Reset and reseed database
npm run db:seed

# Clean database (removes all data)
npx prisma db push --force-reset
```

## Vercel Deployment Setup

### 1. Connect Repository:
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project" → "Import Git Repository"
3. Connect your GitHub account and select `Prospello` repository
4. Vercel will auto-detect Next.js settings

### 2. Environment Variables:
In Vercel dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://username:password@host:5432/database
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
NEXT_PUBLIC_BRAND_NAME=Prospello
NEXT_PUBLIC_BRAND_TAGLINE=Modern OKR & Check-in Platform
```

### 3. Database Setup for Production:
```bash
# 1. Create PostgreSQL database (use Vercel Postgres, Supabase, or Railway)
# 2. Run migrations on production
npx prisma migrate deploy

# 3. Seed production data (optional)
npm run db:seed
```

### 4. Build Settings:
Vercel auto-detects Next.js, but verify:
- **Framework Preset:** Next.js
- **Root Directory:** `./` (leave empty)
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (auto-detected)

### 5. Deploy:
```bash
# Push to main branch to auto-deploy
git push origin main

# Or deploy manually from Vercel dashboard
```

### Vercel CLI Commands:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy project
vercel

# Check deployment status
vercel ls
```

## Production Database Migration

### Switching from SQLite to PostgreSQL:

1. **Update schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Run migration:**
```bash
npx prisma migrate dev --name "switch-to-postgres"
npx prisma db push
```

3. **Update environment:**
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

### Monitoring Production:
- **Vercel Analytics:** Real-time performance metrics
- **Vercel Logs:** Application logs and errors
- **Database Monitoring:** Check your PostgreSQL provider's dashboard

## Troubleshooting

### Common Issues:
```bash
# Database connection issues
npx prisma db push --force-reset

# Migration conflicts
npx prisma migrate resolve --applied 20231201123456_migration_name

# Clean node_modules
rm -rf node_modules && npm install
```

### Performance Monitoring:
- Use Vercel's built-in analytics
- Monitor database query performance with Prisma logging
- Check bundle size with `npm run build && npx @next/bundle-analyzer`
