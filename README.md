# Prospello

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
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)
- **Authentication**: NextAuth.js
- **Deployment**: Vercel-ready

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/prospello.git
   cd prospello
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

4. **Set up database**
   ```bash
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
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional Branding
NEXT_PUBLIC_BRAND_NAME="Prospello"
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

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment

For other platforms, ensure you have:

- Node.js 18+
- PostgreSQL database
- Environment variables configured
- `npm run build && npm start` for production

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
