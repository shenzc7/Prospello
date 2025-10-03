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
