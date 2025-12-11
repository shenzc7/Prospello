# OKR Builder

A modern OKR (Objectives and Key Results) tracking platform built with Next.js 15, designed to help teams set, track, and align organizational goals with real-time progress monitoring.

## Features

- **OKR Management**: Create and track objectives with measurable key results
- **Weekly Check-ins**: Traffic light status system (Green/Yellow/Red) for progress updates
- **Role-based Access**: Separate dashboards for Admins, Managers, and Employees
- **Team Collaboration**: Commenting system and progress sharing
- **Analytics & Reporting**: Trend analysis and export capabilities
- **Goal Alignment**: Hierarchical goal structure (Company → Team → Individual)

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel-ready

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/okr-builder.git
   cd okr-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up database (PostgreSQL)**
   ```bash
   # Ensure Postgres is running locally, e.g.:
   # docker run --name okrflow-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=okrflow -p 5432:5432 -d postgres:15
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Accounts

After seeding the database, you can use these accounts to explore different user roles:

- **Admin**: `admin@techflow.dev` / `Pass@123`
- **Manager**: `manager@techflow.dev` / `Pass@123`
- **Employee**: `me@techflow.dev` / `Pass@123`

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/okrflow?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# SSO (optional but recommended for production)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# Optional Branding
NEXT_PUBLIC_BRAND_NAME="OKR Builder"
NEXT_PUBLIC_BRAND_TAGLINE="Modern OKR & Check-in Platform"
NEXT_PUBLIC_BRAND_LOGO_URL=""
```

## Database Schema

The application uses Prisma ORM with the following main entities:

- **Users**: Authentication and role management (ADMIN, MANAGER, EMPLOYEE)
- **Organizations**: Multi-tenant support
- **Teams**: Department/team groupings
- **Objectives**: Main OKRs with goal types (COMPANY, DEPARTMENT, TEAM, INDIVIDUAL)
- **Key Results**: Measurable outcomes with weighted progress
- **Initiatives**: Action items per key result
- **Check-ins**: Weekly progress updates with traffic light status
- **Comments**: Discussion system for objectives and key results

## Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:seed      # Seed database with demo data
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Create and apply migrations
```

## Deployment

### Vercel Deployment (Recommended)

#### Option 1: Using Vercel Web Interface

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com) and sign up/login
   - Click "New Project" → "Import Git Repository"
   - Connect your GitHub account and select the OKR Builder repository

2. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave empty)
   - Build Command: `npm run build` (auto-detected)

3. **Set Environment Variables:**
   In Project Settings → Environment Variables, add:

   ```
   DATABASE_URL=postgresql://username:password@host:5432/database
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-production-secret-key
   NEXT_PUBLIC_BRAND_NAME=OKR Builder
   NEXT_PUBLIC_BRAND_TAGLINE=Modern OKR & Check-in Platform
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build completion
   - Your app will be live at `https://your-app.vercel.app`

#### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel --prod

# Or use the provided script
./deploy.sh
```

#### Database Setup for Production

**Recommended: Vercel Postgres**
1. In Vercel dashboard, go to Storage → Create Database → Postgres
2. Copy the connection string
3. Set `DATABASE_URL` environment variable
4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   npm run db:seed  # Optional: seed demo data
   ```

**Alternative: External PostgreSQL**
- Use services like Supabase, Railway, or PlanetScale
- Ensure the database is accessible from Vercel's IP ranges

### Manual Deployment

For other platforms, ensure you have:
- Node.js 18+
- PostgreSQL database
- Environment variables configured
- Run `npm run build && npm start` for production

### Scheduled Jobs (Reminders & Scoring)

- Add a CRON trigger (e.g., Vercel Cron) to call:
  - `POST /api/cron/reminders?orgId=<ORG_ID>` with header `x-cron-secret: $CRON_SECRET`
  - `POST /api/cron/scoring?orgId=<ORG_ID>` with header `x-cron-secret: $CRON_SECRET`
- Set `CRON_SECRET` in your environment to authorize these runs.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (app)/             # Protected routes
│   ├── (auth)/            # Authentication routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard components
│   └── auth/             # Authentication components
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
