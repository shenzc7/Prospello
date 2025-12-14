# OKRFlow - Enterprise OKR Management Platform

## Enterprise Architecture Overview

OKRFlow is a production-grade Objectives and Key Results (OKR) management platform built on modern web technologies, designed for enterprise-scale organizations requiring sophisticated goal management, real-time progress tracking, and multi-tenant architecture.

### Core Architectural Principles

- **Multi-tenant Design**: Complete organizational isolation with per-tenant SSO and data segregation
- **Event-Driven Architecture**: Real-time updates via WebSocket connections and database triggers
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with React
- **Zero-Trust Security**: Comprehensive RBAC with row-level security policies
- **Performance-First**: Sub-100ms API responses with intelligent caching strategies

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 15.0+ | Full-stack React framework with App Router |
| **Runtime** | Node.js | 18.17+ | Server-side JavaScript execution |
| **Language** | TypeScript | 5.3+ | Type-safe JavaScript with strict mode |
| **Database** | PostgreSQL | 15+ | ACID-compliant relational database |
| **ORM** | Prisma | 5.7+ | Type-safe database access with migrations |
| **Authentication** | NextAuth.js | 4.24+ | Enterprise SSO with multi-provider support |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Latest | Accessible, customizable component library |
| **State Management** | TanStack Query | 5.17+ | Server state management with caching |
| **Testing** | Jest + Playwright | Latest | Unit, integration, and E2E testing |
| **Deployment** | Vercel | Enterprise | Global edge network deployment |

> **Handoff quick links:**  
> • [docs/ONBOARDING.md](docs/ONBOARDING.md) – step-by-step guide for new engineers/admins  
> • [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) – production/Vercel launch checklist

## Enterprise Feature Set

### Core OKR Management (`/app/(app)/okrs/`, `/lib/okr.ts`)
- **Hierarchical Objectives**: Company → Department → Team → Individual alignment
- **Weighted Key Results**: Configurable contribution percentages with automatic rollup
- **Cycle Management**: Time-bound periods with automated scoring and completion
- **Progress Tracking**: Real-time calculation with confidence intervals

### Advanced Check-in System (`/app/(app)/checkins/`, `/lib/checkin-summary.ts`)
- **Traffic Light Status**: Green/Yellow/Red indicators with configurable thresholds
- **Automated Reminders**: Cron-based notifications with escalation policies
- **Progress Forecasting**: Predictive analytics for cycle completion
- **Historical Tracking**: Complete audit trail with change detection

### Enterprise Security (`/lib/auth.ts`, `/lib/rbac.ts`, `/middleware.ts`)
- **Multi-tenant SSO**: Google Workspace, Azure AD, Okta, Auth0 integration
- **Role-Based Access Control**: Granular permissions with inheritance
- **Audit Logging**: Complete user action tracking for compliance
- **Data Encryption**: AES-256 encryption for sensitive data at rest

### Global Localization & Customization (`/config/locale.ts`, `/lib/orgSettings.ts`)
- **Fiscal Year Configuration**: Custom fiscal year start month for financial reporting
- **Week Start Settings**: Monday/Sunday week start configuration
- **Scoring Scale Options**: Percentage (0-100%) or fraction (0.0-1.0) scoring
- **Number & Date Formatting**: Locale-specific number formatting and date display
- **Hierarchy Labels**: Customizable labels for Company/Department/Team/Individual levels
- **High Contrast Mode**: Accessibility support for users with visual impairments

### Advanced Analytics & Reporting (`/app/(app)/reports/`, `/components/analytics/`)
- **Real-time Dashboards**: Live progress visualization with WebSocket updates
- **Custom Reporting**: PDF/Excel export with scheduled delivery
- **Trend Analysis**: Historical data with statistical significance testing
- **Predictive Insights**: ML-based forecasting for goal achievement
- **Executive Dashboards**: Company-wide OKR alignment and progress tracking

### Collaboration Platform (`/components/collaboration/`, `/lib/notifications.ts`)
- **Threaded Discussions**: Context-aware commenting on objectives and KRs
- **Mention System**: @user notifications with email/webhook delivery
- **File Attachments**: Secure document sharing with access controls
- **Activity Feeds**: Real-time collaboration streams

## Development Environment Setup

> Need the abridged handoff? See [docs/ONBOARDING.md](docs/ONBOARDING.md) for a checklist-style version of this section.

### Prerequisites

**System Requirements:**
- **Node.js**: 18.17.0+ (LTS recommended) - Verify with `node --version`
- **PostgreSQL**: 15.0+ - Local installation or Docker container
- **Git**: 2.30+ - For version control operations
- **npm**: 9.0+ - Package manager (bundled with Node.js)

**Recommended Development Tools:**
- **VS Code**: With TypeScript, ESLint, and Prettier extensions
- **Docker Desktop**: For PostgreSQL and testing environments
- **Postman/Insomnia**: API testing and documentation
- **Database GUI**: pgAdmin, TablePlus, or DBeaver

### Local Development Setup

#### 1. Repository Initialization
   ```bash
# Clone the monorepo
git clone <repository-url>
   cd okr-builder

# Verify Node.js version compatibility
node --version  # Should be 18.17.0+

# Install dependencies with exact versions
npm ci
```

#### 2. Environment Configuration (`/.env.example` → `/.env.local`)
   ```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your local configuration
# Critical: Never commit .env.local to version control
```

**Required Environment Variables:**
   ```bash
# Database Configuration - Critical for all operations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/okrflow?schema=public"

# NextAuth.js - Required for authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-random-secret-here"

# Application Settings
NEXT_PUBLIC_ALLOW_PASSWORD_AUTH="true"
NODE_ENV="development"
```

#### 3. Database Initialization (`/prisma/`)

**PostgreSQL Setup Options:**

*Option A: Docker Container (Recommended)*
   ```bash
# Start PostgreSQL container
docker run --name okrflow-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=okrflow \
  -p 5432:5432 \
  -d postgres:15

# Verify connection
pg_isready -h localhost -p 5432
```

*Option B: Local PostgreSQL Installation*
   ```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb okrflow
```

**Database Migration and Seeding:**
   ```bash
# Generate Prisma client with type definitions
   npx prisma generate

# Apply database migrations (safe, non-destructive)
   npx prisma migrate dev

# Populate with demo data for development
   npm run db:seed
   ```

#### 4. Application Startup

**Development Server (`/package.json` scripts):**
   ```bash
# Standard development mode
   npm run dev

# Development with public access (for external testing)
npm run dev:public

# Development with route warming (faster initial loads)
npm run dev:warm
```

**Server Verification:**
```bash
# Check server health
curl http://localhost:3000/api/health

# Verify database connectivity
npx prisma studio  # Opens database GUI at http://localhost:5555
```

#### 5. Development Workflow Verification

**Code Quality Checks:**
```bash
# TypeScript compilation verification
npx tsc --noEmit

# ESLint code quality analysis
npm run lint

# Unit test execution
npm test

# Full CI regression gate (lint → tests → build)
npm run verify

# E2E test suite (requires running server)
npx playwright test
```

**First-Time Setup Validation:**
```bash
# 1. Open http://localhost:3000
# 2. Login with demo account: admin@techflow.dev / Pass@123
# 3. Verify OKR creation and check-in functionality
# 4. Test admin dashboard at /admin
# 5. Confirm email notifications (if SMTP configured)
```

## Development Environment Deep Dive

### Advanced Development Configuration

#### Environment-Specific Overrides (`/.env.local`, `/.env.production.local`)

**Development Optimizations:**
```bash
# Enable detailed logging for debugging
PRISMA_LOG_LEVEL="query"
PRISMA_LOG_QUERIES="true"

# Disable email sending in development
DISABLE_EMAIL_DELIVERY="true"

# Enable development-specific features
NEXT_PUBLIC_ENABLE_DEMOMODE="true"
NEXT_PUBLIC_PRD_MODE="false"
```

#### External Access Configuration

**Network Exposure for Testing (`/package.json`):**
```bash
# Bind to all interfaces for external access
npm run dev:public

# Create secure tunnels for external testing
# Cloudflare Tunnel (recommended for production parity)
cloudflared tunnel --url http://localhost:3000

# ngrok (development testing)
npx ngrok http 3000

# Update NextAuth callback URLs accordingly
NEXTAUTH_URL="https://your-tunnel-domain.com"
```

#### Performance Optimization (`/scripts/warmup.mjs`)

**Route Pre-compilation:**
```bash
# Warm up critical routes for faster development navigation
npm run warmup

# Combined development startup with warming
npm run dev:warm
```

**Performance Monitoring:**
```bash
# Bundle analysis
npm run build --analyze

# Runtime performance profiling
# Use React DevTools Profiler in development
```

### Testing Accounts and Data (`/prisma/seed.ts`)

**Role-Based Test Accounts:**
```typescript
// Admin Account - Full system access
// Email: admin@techflow.dev
// Password: Pass@123
// Permissions: All operations, user management, system configuration

// Manager Account - Department/team management
// Email: manager@techflow.dev
// Password: Pass@123
// Permissions: Team OKRs, user invitations, reporting

// Employee Account - Individual contributor
// Email: me@techflow.dev
// Password: Pass@123
// Permissions: Personal OKRs, check-ins, basic reporting
```

**Demo Data Structure:**
- **Organizations**: TechFlow Solutions (primary demo org)
- **Teams**: Engineering, Product, Design, Marketing
- **OKRs**: Pre-populated with realistic objectives and KRs
- **Check-ins**: Historical data spanning multiple cycles
- **Users**: Distributed across teams with appropriate roles

## Configuration Management (`/.env.example`, `/config/`)

### Environment Variable Reference

#### Database Configuration (`/prisma/schema.prisma`)
```bash
# PostgreSQL Connection String (Required)
# Format: postgresql://username:password@host:port/database?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/okrflow?schema=public"

# Connection Pooling (Production)
DATABASE_URL="$DATABASE_URL&connection_limit=10&pool_timeout=20"

# SSL Configuration (Production)
DATABASE_URL="$DATABASE_URL&sslmode=require"
```

#### Authentication System (`/lib/auth.ts`, `/app/api/auth/`)
```bash
# NextAuth.js Core Configuration
NEXTAUTH_URL="http://localhost:3000"                    # Public app URL
NEXTAUTH_SECRET="your-32-char-random-secret-here"       # HMAC signing key

# Authentication Policies
REQUIRE_SSO="false"                                     # Force SSO-only login
ALLOW_PASSWORD_AUTH="true"                             # Enable password auth
NEXT_PUBLIC_ALLOW_PASSWORD_AUTH="true"                 # Client-side password UI

# Session Configuration
NEXTAUTH_SESSION_MAX_AGE=604800                        # 7 days in seconds
NEXTAUTH_SESSION_UPDATE_AGE=86400                      # 24 hours
```

#### Identity Provider Configuration (`/lib/idp.ts`)
```bash
# Google OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft Azure AD
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"

# Slack OAuth
SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"

# Generic OIDC Provider
OIDC_CLIENT_ID="your-oidc-client-id"
OIDC_CLIENT_SECRET="your-oidc-client-secret"
OIDC_ISSUER="https://your-oidc-provider.com"
```

#### Email Infrastructure (`/lib/mailer.ts`)
```bash
# SMTP Configuration (Required for email features)
SMTP_HOST="smtp.gmail.com"                             # SMTP server hostname
SMTP_PORT="587"                                        # Port (587 TLS, 465 SSL, 25 plain)
SMTP_USER="your-email@gmail.com"                       # SMTP authentication username
SMTP_PASS="your-app-specific-password"                 # SMTP password/app key
SMTP_FROM="OKRFlow <noreply@yourcompany.com>"         # From address

# Email Delivery Controls
DISABLE_EMAIL_DELIVERY="false"                         # Disable for development
EMAIL_BATCH_SIZE="50"                                  # Batch processing limit
```

#### Notification Webhooks (`/lib/notifications.ts`)
```bash
# Slack Integration
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Microsoft Teams
TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/YOUR/WEBHOOK/URL"

# Custom Webhook Endpoint
WEBHOOK_ENDPOINT="https://your-webhook-endpoint.com/notifications"
WEBHOOK_SECRET="your-webhook-secret-for-verification"
```

#### Background Job Scheduling (`/lib/scheduler.ts`)
```bash
# Cron Job Authentication
CRON_SECRET="your-very-long-random-cron-secret"

# Internal Scheduler (Fallback)
SCHEDULER_INTERVAL_MS=900000                           # 15 minutes
DISABLE_INTERNAL_SCHEDULER="false"                     # Enable/disable internal scheduler
SKIP_SCHEDULER_FOR_BUILD="true"                        # Skip during build process

# Job-Specific Intervals
REMINDER_JOB_INTERVAL_MS=86400000                      # 24 hours
SCORING_JOB_INTERVAL_MS=21600000                       # 6 hours
```

#### Feature Flags (`/config/features.ts`)
```bash
# Development Mode Override
NEXT_PUBLIC_PRD_MODE="false"                           # Enable all features in development

# Individual Feature Toggles
NEXT_PUBLIC_ENABLE_ADMINEXTRAS="true"                 # Admin dashboard features
NEXT_PUBLIC_ENABLE_BOARD_VIEW="true"                  # Kanban board interface
NEXT_PUBLIC_ENABLE_NOTIFICATION_FEED="true"           # Real-time notifications
NEXT_PUBLIC_ENABLE_DEMOMODE="true"                    # Demo data and controls
NEXT_PUBLIC_ENABLE_USER_SWITCHER="true"               # Role switching for testing

# UI Customization
NEXT_PUBLIC_ENABLE_APPEARANCE_SETTINGS="false"        # Theme/language settings
NEXT_PUBLIC_ENABLE_THEME_TOGGLE="false"               # Light/dark mode (disabled)
```

#### Branding and Customization (`/config/strings.ts`)
```bash
# Public Branding (Client-side)
NEXT_PUBLIC_BRAND_NAME="OKRFlow"
NEXT_PUBLIC_BRAND_TAGLINE="Enterprise OKR Management Platform"
NEXT_PUBLIC_BRAND_LOGO_URL=""

# Application Metadata
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_SUPPORT_EMAIL="support@yourcompany.com"
NEXT_PUBLIC_PRIVACY_URL="https://yourcompany.com/privacy"
NEXT_PUBLIC_TERMS_URL="https://yourcompany.com/terms"
```

#### Development and Debugging (`/.env.local`)
```bash
# Enhanced Logging (Development)
PRISMA_LOG_LEVEL="query"                              # Database query logging
PRISMA_LOG_QUERIES="true"                            # Detailed query information

# Performance Monitoring
ENABLE_PERFORMANCE_LOGGING="true"                    # Response time tracking
ENABLE_MEMORY_PROFILING="false"                      # Memory usage monitoring

# Security Headers (Development)
ENABLE_SECURITY_HEADERS="false"                      # Disable for API testing
CORS_ORIGIN="http://localhost:3000"                  # CORS configuration

# Localization Settings (Development)
NEXT_PUBLIC_FISCAL_YEAR_START_MONTH="4"              # April (India default)
NEXT_PUBLIC_WEEK_START_DAY="monday"                  # Monday week start
NEXT_PUBLIC_SCORING_SCALE="percent"                  # 0-100% scoring
NEXT_PUBLIC_NUMBER_LOCALE="en-IN"                    # Indian number format
NEXT_PUBLIC_DATE_FORMAT="dd-mm-yyyy"                 # DD-MM-YYYY format
NEXT_PUBLIC_HIGH_CONTRAST_STATUS="false"             # High contrast mode
NEXT_PUBLIC_LABEL_COMPANY="Company"                  # Custom hierarchy labels
NEXT_PUBLIC_LABEL_DEPARTMENT="Department"
NEXT_PUBLIC_LABEL_TEAM="Team"
NEXT_PUBLIC_LABEL_INDIVIDUAL="Individual"
```

#### Production Optimizations (`/.env.production.local`)
```bash
# Performance and Caching
REDIS_URL="redis://localhost:6379"                   # Session storage
CACHE_TTL=3600                                       # Cache expiration (seconds)
ENABLE_RESPONSE_COMPRESSION="true"                   # Gzip compression

# Monitoring and Observability
SENTRY_DSN="your-sentry-dsn"                         # Error tracking
LOG_LEVEL="warn"                                     # Production log level
ENABLE_PROMETHEUS_METRICS="true"                    # Application metrics

# Security Hardening
ENABLE_RATE_LIMITING="true"                          # API rate limiting
RATE_LIMIT_REQUESTS_PER_MINUTE="100"                # Per-user limits
ENABLE_CSRF_PROTECTION="true"                        # CSRF token validation
```

## Database Architecture (`/prisma/schema.prisma`)

### Schema Design Principles

- **Normalized Structure**: Third normal form with strategic denormalization for performance
- **Audit Trail**: Complete change history with immutable logging tables
- **Multi-tenancy**: Row-level security with organization-based data isolation
- **Performance Optimization**: Strategic indexing and query optimization
- **Type Safety**: Prisma-generated TypeScript types for compile-time safety

### Core Entity Relationships

#### User Management Domain (`/prisma/schema.prisma` lines 50-120)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(EMPLOYEE)
  organizationId String
  teamId        String?

  // Authentication
  emailVerified DateTime?
  accounts      Account[]
  sessions      Session[]

  // Profile and preferences
  avatar        String?
  timezone      String    @default("UTC")
  settings      Json?     // User-specific configuration

  // Audit fields
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relationships
  organization  Organization @relation(fields: [organizationId], references: [id])
  team          Team?        @relation(fields: [teamId], references: [id])
  objectives    Objective[]
  checkIns      CheckIn[]
  comments      Comment[]

  @@map("users")
}
```

#### Organization Domain (`/prisma/schema.prisma` lines 10-40)
```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique // URL-friendly identifier
  domain    String?  // Primary domain for SSO

  // Configuration
  settings  Json?    // Organization-specific settings
  features  Json?    // Enabled features and limits

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  users         User[]
  teams         Team[]
  objectives    Objective[]
  identityProviders IdentityProviderConfig[]

  @@map("organizations")
}
```

#### OKR Domain (`/prisma/schema.prisma` lines 150-250)

**Objective Entity:**
```prisma
model Objective {
  id             String      @id @default(cuid())
  title          String
  description    String?
  type           GoalType    // COMPANY | DEPARTMENT | TEAM | INDIVIDUAL
  status         Status      @default(ACTIVE)

  // Temporal boundaries
  startDate      DateTime
  endDate        DateTime
  cycleId        String?     // Links to OKR cycles

  // Hierarchical relationships
  organizationId String
  parentId       String?     // Parent objective for alignment
  ownerId        String      // Primary owner
  teamId         String?     // Associated team

  // Progress calculation
  progress       Float       @default(0) // 0-1 scale
  confidence     Float?      // 0-1 confidence level

  // Metadata
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  createdById    String

  // Relationships
  organization   Organization @relation(fields: [organizationId], references: [id])
  owner          User         @relation(fields: [ownerId], references: [id])
  team           Team?        @relation(fields: [teamId], references: [id])
  parent         Objective?   @relation("ObjectiveHierarchy", fields: [parentId], references: [id])
  children       Objective[]  @relation("ObjectiveHierarchy")
  keyResults     KeyResult[]
  checkIns       CheckIn[]
  comments       Comment[]

  @@map("objectives")
}
```

**Key Result Entity:**
```prisma
model KeyResult {
  id           String     @id @default(cuid())
  title        String
  description  String?
  type         KRType     // METRIC | BOOLEAN | PERCENTAGE

  // Measurement
  targetValue  Float?
  currentValue Float      @default(0)
  unit         String?    // "users", "dollars", "%", etc.

  // Weighting and progress
  weight       Float      @default(1) // Contribution to objective
  progress     Float      @default(0) // 0-1 completion scale

  // Temporal tracking
  objectiveId  String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // Relationships
  objective    Objective   @relation(fields: [objectiveId], references: [id])
  initiatives  Initiative[]
  checkIns     CheckIn[]

  @@map("key_results")
}
```

#### Check-in and Progress Tracking (`/prisma/schema.prisma` lines 300-400)

**CheckIn Entity:**
```prisma
model CheckIn {
  id           String       @id @default(cuid())
  status       CheckInStatus // GREEN | YELLOW | RED
  notes        String?
  confidence   Float?       // 0-1 confidence level

  // Temporal context
  checkInDate  DateTime     @default(now())
  weekOf       DateTime     // ISO week start date

  // Relationships
  userId       String
  objectiveId  String
  keyResultId  String?

  // Audit
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  user         User         @relation(fields: [userId], references: [id])
  objective    Objective    @relation(fields: [objectiveId], references: [id])
  keyResult    KeyResult?   @relation(fields: [keyResultId], references: [id])

  @@index([userId, weekOf])
  @@index([objectiveId, checkInDate])
  @@map("check_ins")
}
```

#### Notification and Communication (`/prisma/schema.prisma` lines 450-550)

**Notification Entity:**
```prisma
model Notification {
  id        String            @id @default(cuid())
  type      NotificationType  // CHECKIN_DUE | COMMENT | MENTION | SYSTEM
  title     String
  message   String
  read      Boolean           @default(false)

  // Context and metadata
  userId    String
  metadata  Json?             // Additional context data

  // Timestamps
  createdAt DateTime          @default(now())
  readAt    DateTime?

  user      User              @relation(fields: [userId], references: [id])

  @@index([userId, read, createdAt])
  @@map("notifications")
}
```

### Database Indexes and Performance (`/prisma/schema.prisma`)

#### Strategic Indexing Strategy
```prisma
// User lookup optimization
@@index([email, organizationId])
@@index([organizationId, role])

// OKR hierarchy queries
@@index([organizationId, type, status])
@@index([parentId])
@@index([ownerId, status])

// Check-in performance
@@index([objectiveId, checkInDate])
@@index([userId, weekOf])
@@index([keyResultId, checkInDate])

// Notification delivery
@@index([userId, read, createdAt])
@@index([type, createdAt])

// Search and filtering
@@index([title])
@@index([description])
```

#### Query Optimization Patterns
- **Connection Pooling**: Configured via `DATABASE_URL` parameters
- **Read Replicas**: Support for read-heavy workloads
- **Query Batching**: Prisma's built-in N+1 query prevention
- **Caching Layer**: Redis integration for session and query caching

## Development Workflow (`/package.json`)

### Core Development Scripts

#### Application Lifecycle (`/package.json` scripts)
```bash
# Development server with hot reload
npm run dev
# Options: --turbopack (faster), --port 3001, --hostname 0.0.0.0

# Production build optimization
npm run build
# Outputs optimized bundles to /.next with analysis

# Production server execution
npm start
# Serves optimized build with production middleware

# Public development access
npm run dev:public
# Binds to 0.0.0.0 for external network access
```

#### Code Quality Assurance (`/eslint.config.js`, `/jest.config.js`)
```bash
# Static analysis and linting
npm run lint
# Rules: TypeScript strict, React best practices, accessibility

# Unit test execution with coverage
npm test
# Framework: Jest + React Testing Library
# Coverage thresholds: branches(80%), functions(80%), lines(80%)

# Test watch mode for development
npm run test:watch
# Interactive mode with file watching and selective test execution

# End-to-end testing suite
npx playwright test
# Browsers: Chromium, Firefox, Safari (WebKit)
# Parallel execution with video recording on failure
```

#### Database Operations (`/prisma/`, `/package.json`)
```bash
# Database schema generation
npx prisma generate
# Generates TypeScript types and client from schema.prisma

# Development migration with shadow database
npx prisma migrate dev
# Creates migration files and applies to development database

# Production migration (safe, non-destructive)
npx prisma migrate deploy
# Applies pending migrations to production database

# Database seeding with demo data
npm run db:seed
# Executes /prisma/seed.ts with TypeScript support

# Database visualization and editing
npx prisma studio
# Web-based GUI at http://localhost:5555

# Database schema validation
npx prisma validate
# Checks schema correctness and referential integrity

# Migration status and history
npx prisma migrate status
# Shows applied vs pending migrations
```

#### Utility and Maintenance Scripts (`/scripts/`, `/package.json`)
```bash
# Route warming for development performance
npm run warmup
# Pre-compiles critical routes using /scripts/warmup.mjs

# Combined development startup with warming
npm run dev:warm
# Starts dev server and warms routes simultaneously

# Type checking without emission
npx tsc --noEmit
# Validates TypeScript compilation without generating files

# Bundle analysis (requires build first)
npm run build:analyze
# Generates webpack bundle analyzer report
```

### Advanced Development Commands

#### Database Management
```bash
# Reset development database (destructive)
npx prisma migrate reset
# Drops all data and re-applies all migrations

# Database schema diff
npx prisma db diff
# Shows differences between schema and database

# Push schema changes (development only)
npx prisma db push
# Directly applies schema changes without migrations

# Seed with custom data
npm run db:seed:custom
# Loads specific test datasets for development
```

#### Performance and Debugging
```bash
# Bundle size analysis
npx @next/bundle-analyzer
# Visualizes JavaScript bundle composition

# Lighthouse performance audit
npx lighthouse http://localhost:3000
# Automated performance, accessibility, and SEO testing

# Memory leak detection
npm run dev:profile
# Runs development server with memory profiling
```

#### Testing and Quality Assurance
```bash
# Accessibility testing
npx playwright test e2e/a11y.spec.ts
# Automated WCAG compliance testing

# Visual regression testing
npx playwright test e2e/visual.spec.ts
# Screenshot comparison for UI consistency

# Load testing (requires Artillery)
npx artillery run load-test.yml
# Performance testing with configurable scenarios

# Security audit
npm audit
# Checks dependencies for known vulnerabilities
npx audit-ci --high
# Fails CI on high-severity vulnerabilities
```

## Enterprise Deployment Architecture (`/vercel.json`, `/deploy.sh`)

### Deployment Strategy Overview

OKRFlow supports multiple deployment topologies optimized for enterprise requirements:

- **Serverless-First**: Vercel deployment with global edge network
- **Containerized**: Docker-based deployment for Kubernetes/VM environments
- **Hybrid**: Serverless functions with dedicated database and caching layers

For a short operational checklist, reference [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md).

### Vercel Enterprise Deployment (`/vercel.json`)

#### Production Environment Setup

**1. Project Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "fra1", "sin1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "crons": [
    {
      "path": "/api/cron/reminders?orgId=all",
      "schedule": "0 9 * * 1-5"
    },
    {
      "path": "/api/cron/scoring?orgId=all",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**2. Environment Variable Management:**
   ```bash
# Production Secrets (Vercel CLI)
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add CRON_SECRET production

# Bulk environment import
vercel env pull .env.production.local
```

**3. Database Integration:**
```bash
# Vercel Postgres (Recommended)
# Automatic connection pooling and scaling
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db"

# Alternative: External PostgreSQL
# Ensure connection limits and SSL
DATABASE_URL="postgresql://user:pass@your-db-host.com:5432/db?sslmode=require&connection_limit=20"
```

#### Deployment Pipeline (`/deploy.sh`)
```bash
#!/bin/bash
# Enterprise deployment script with rollback capability

set -e  # Exit on any error

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run lint
npm run build
npm run test:ci

# Database migration safety check
echo "🗄️ Checking database migrations..."
npx prisma migrate status

# Deploy with rollback preparation
echo "🚀 Deploying to production..."
vercel --prod --yes

# Post-deployment verification
echo "✅ Verifying deployment..."
curl -f https://your-app.vercel.app/api/health

# Database migration application
echo "🗃️ Applying database migrations..."
   npx prisma migrate deploy

echo "🎉 Deployment completed successfully!"
```

### Docker Containerization (`/Dockerfile`, `/docker-compose.yml`)

#### Production Dockerfile
```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production --ignore-scripts

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

#### Docker Compose for Development
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/okrflow
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=okrflow
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Infrastructure as Code (IaC)

#### Terraform Configuration (AWS)
```hcl
# main.tf - Production infrastructure
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC and networking
resource "aws_vpc" "okrflow" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "okrflow-production"
    Environment = "production"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "okrflow" {
  identifier             = "okrflow-production"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.medium"
  allocated_storage      = 20
  max_allocated_storage  = 100

  db_name                = "okrflow"
  username               = var.db_username
  password               = var.db_password
  port                   = 5432

  multi_az               = true
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.okrflow.name

  tags = {
    Environment = "production"
  }
}

# ElastiCache Redis (optional)
resource "aws_elasticache_cluster" "okrflow" {
  cluster_id           = "okrflow-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  port                 = 6379

  tags = {
    Environment = "production"
  }
}
```

### Background Job Orchestration (`/lib/scheduler.ts`, `/app/api/cron/`)

#### Cron Job Architecture

**External Cron Configuration (Recommended):**
```bash
# Vercel Cron (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/reminders?orgId=all",
      "schedule": "0 9 * * 1-5"  // Monday-Friday 9 AM
    },
    {
      "path": "/api/cron/scoring?orgId=all",
      "schedule": "0 */6 * * *"   // Every 6 hours
    }
  ]
}

# Alternative: External cron service
# Configure webhook endpoints with authentication
CRON_SECRET="your-production-cron-secret"
```

**Internal Scheduler (Fallback):**
```typescript
// /lib/scheduler.ts
const SCHEDULER_CONFIG = {
  enabled: !isBuildPhase && process.env.DISABLE_INTERNAL_SCHEDULER !== 'true',
  interval: Number(process.env.SCHEDULER_INTERVAL_MS || 15 * 60 * 1000), // 15 min
  jobs: {
    reminders: {
      interval: 24 * 60 * 60 * 1000, // Daily
      endpoint: '/api/cron/reminders'
    },
    scoring: {
      interval: 6 * 60 * 60 * 1000,  // Every 6 hours
      endpoint: '/api/cron/scoring'
    }
  }
}
```

#### Job Execution and Monitoring
```typescript
// /app/api/cron/reminders/route.ts
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-cron-secret')
  if (authHeader !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Execute job logic
    const results = await runReminderJob()

    // Log execution metrics
    console.log(`Reminder job completed: ${results.processed} notifications sent`)

    return Response.json({
      success: true,
      processed: results.processed,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Comprehensive error handling and alerting
    console.error('Reminder job failed:', error)
    // Send alert to monitoring system
    return Response.json({ error: 'Job execution failed' }, { status: 500 })
  }
}
```

### Production Monitoring and Observability

#### Application Performance Monitoring (APM)
```bash
# Sentry Configuration
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ENVIRONMENT="production"
NEXT_PUBLIC_SENTRY_DSN=$SENTRY_DSN

# Performance monitoring
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
```

#### Database Monitoring
```bash
# Connection pool monitoring
DATABASE_URL="$DATABASE_URL&connection_limit=20&pool_timeout=30"

# Query performance logging (development)
PRISMA_LOG_LEVEL="query"
PRISMA_LOG_QUERIES="true"

# Production: External monitoring
# - AWS CloudWatch for RDS metrics
# - DataDog or New Relic for application metrics
```

#### Health Checks and Readiness Probes
```typescript
// /app/api/health/route.ts
export async function GET() {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`

    // External service checks
    const authHealth = await checkAuthService()
    const emailHealth = await checkEmailService()

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        authentication: authHealth ? 'healthy' : 'degraded',
        email: emailHealth ? 'healthy' : 'degraded'
      }
    })
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 503 }
    )
  }
}
```

### Security Hardening for Production

#### Network Security
```bash
# Environment-specific CORS
CORS_ORIGIN="https://yourdomain.com"
ENABLE_CSRF_PROTECTION="true"

# Rate limiting
ENABLE_RATE_LIMITING="true"
RATE_LIMIT_REQUESTS_PER_MINUTE="100"

# Security headers
ENABLE_SECURITY_HEADERS="true"
```

#### Data Protection
```bash
# Database encryption
DATABASE_URL="$DATABASE_URL&sslmode=require"

# File upload security (if implemented)
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"

# Session security
NEXTAUTH_SESSION_MAX_AGE="604800"  # 7 days
SECURE_COOKIES="true"
```

### Zero-Downtime Deployment Strategy

#### Blue-Green Deployment
```bash
# 1. Deploy to staging environment
vercel --prod=false

# 2. Run integration tests against staging
npm run test:e2e:staging

# 3. Switch traffic to new deployment
vercel promote

# 4. Monitor for 15 minutes
# 5. Rollback if issues detected
vercel rollback
```

#### Database Migration Safety
```bash
# Pre-deployment migration validation
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --shadow-database-url $SHADOW_DB

# Post-deployment verification
npx prisma db execute --file scripts/verify-migration.sql

# Rollback strategy for schema changes
npx prisma migrate resolve --rolled-back <migration-name>
```

## System Architecture and Code Organization

### Application Layer Architecture (`/app/`)

#### Route Structure (`/app/(app)/`, `/app/(auth)/`)
```
app/
├── (app)/                         # Authenticated application routes (/protected/*)
│   ├── admin/                     # Administrative interfaces
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── invitations/          # User invitation management
│   │   └── users/                # User administration
│   ├── alerts/                   # System alerts and notifications
│   ├── checkins/                 # Weekly check-in interface
│   ├── initiatives/              # Initiative tracking and management
│   ├── layout.tsx                # Authenticated app shell
│   ├── my/                       # Personal dashboard
│   ├── my-okrs/                  # Personal OKR management
│   ├── objectives/               # Objective CRUD operations
│   │   ├── [id]/                 # Dynamic objective detail pages
│   │   ├── [id]/edit/            # Objective editing interface
│   │   ├── new/                  # Objective creation
│   │   └── page.tsx              # Objective listing
│   ├── okrs/                     # OKR board and table views
│   │   ├── board/                # Kanban-style OKR board
│   │   ├── [id]/                 # Individual OKR detail
│   │   ├── [id]/edit/            # OKR editing
│   │   ├── new/                  # OKR creation
│   │   └── page.tsx              # OKR overview
│   ├── page.tsx                  # Company dashboard (root)
│   ├── reports/                  # Analytics and reporting
│   ├── settings/                 # User preferences and settings
│   └── teams/                    # Team management interface
├── (auth)/                       # Authentication routes (/auth/*)
│   ├── login/                    # Authentication entry point
│   └── signup/                   # User registration and invitation acceptance
├── api/                          # REST API endpoints (/api/*)
│   ├── admin/                    # Administrative operations
│   ├── auth/                     # NextAuth.js endpoints
│   ├── check-ins/                # Check-in CRUD operations
│   ├── comments/                 # Discussion system
│   ├── cron/                     # Scheduled job triggers
│   ├── export/                   # Data export functionality
│   ├── idp/                      # Identity provider management
│   ├── initiatives/              # Initiative operations
│   ├── invitations/              # User invitation system
│   ├── key-results/              # Key result management
│   ├── notifications/            # Notification system
│   ├── objectives/               # Objective operations
│   ├── reports/                  # Report generation
│   ├── settings/                 # Configuration management
│   ├── teams/                    # Team operations
│   └── users/                    # User management
├── error.tsx                     # Global error boundary (500 errors)
├── globals.css                   # Global CSS variables and resets
├── layout.tsx                    # Root application layout
└── loading.tsx                   # Global loading UI
```

#### API Route Patterns (`/app/api/`)
```typescript
// RESTful endpoint structure
app/api/
├── objectives/
│   ├── route.ts                  # GET /api/objectives, POST /api/objectives
│   └── [id]/
│       └── route.ts              # GET|PUT|DELETE /api/objectives/[id]
├── objectives/[id]/key-results/
│   └── route.ts                  # GET /api/objectives/[id]/key-results
└── cron/
    ├── reminders/
    │   └── route.ts              # POST /api/cron/reminders
    └── scoring/
        └── route.ts              # POST /api/cron/scoring
```

### Component Architecture (`/components/`)

#### Atomic Design Pattern Implementation
```
components/
├── ui/                           # Atomic components (shadcn/ui based)
│   ├── button.tsx               # Base button component
│   ├── input.tsx                # Form input component
│   ├── dialog.tsx               # Modal dialog system
│   └── ...                      # Complete component library
├── layout/                      # Layout components
│   ├── AppHeader.tsx            # Main navigation header
│   ├── AppSidebar.tsx           # Collapsible sidebar navigation
│   ├── PageHeader.tsx           # Page title and actions
│   └── FiltersBar.tsx           # Data filtering interface
├── auth/                        # Authentication components
│   ├── LoginForm.tsx            # Login form with validation
│   ├── SignupForm.tsx           # Registration with invitation support
│   ├── SsoButtons.tsx           # OAuth provider buttons
│   └── SessionProvider.tsx      # Authentication context
├── okrs/                        # OKR-specific components
│   ├── OkrBoard.tsx             # Kanban board implementation
│   ├── OkrTable.tsx             # Data table with sorting/filtering
│   ├── CheckInDrawer.tsx        # Weekly check-in modal
│   ├── KRWeightSlider.tsx       # Key result weighting controls
│   ├── ObjectiveDetailView.tsx  # Objective detail display
│   ├── ObjectiveStatusBadge.tsx # Status indicator component
│   └── ProgressChip.tsx         # Progress visualization
├── objectives/                  # Objective management components
│   ├── objective-form.tsx       # Multi-step objective creation
│   ├── objective-detail.tsx     # Rich objective display
│   ├── key-results-section.tsx  # KR management interface
│   ├── objective-parent-selector.tsx # Hierarchy selection
│   └── objectives-list.tsx      # Paginated objective listing
├── check-ins/                   # Check-in components
│   ├── HistoryPanel.tsx         # Check-in history visualization
│   ├── QuickCheckInRow.tsx      # Compact check-in display
│   └── StatusChip.tsx           # Traffic light status indicator
├── analytics/                   # Data visualization components
│   ├── AlignmentTree.tsx        # Hierarchical alignment visualization
│   ├── HeatMap.tsx              # Progress heatmap calendar
│   └── TimelineView.tsx         # Historical progress timeline
├── collaboration/               # Communication components
│   └── CommentsPanel.tsx        # Threaded discussion system
├── dashboard/                   # Dashboard widgets
│   └── Dashboard.tsx            # Main dashboard orchestration
├── admin/                       # Administrative components
│   ├── admin-users-client.tsx   # User management interface
│   ├── admin-users-row.tsx      # User table row component
│   └── UserSwitcher.tsx         # Role-switching utility
├── demo/                        # Development utilities
│   ├── DemoProvider.tsx         # Demo data context
│   └── DemoToggle.tsx           # Demo mode controls
├── brand/                       # Branding components
│   └── Logo.tsx                 # Company logo component
├── board/                       # Kanban board components
│   ├── ObjectiveCard.tsx        # Draggable objective card
│   └── StatusColumn.tsx         # Kanban column with drag-drop
├── navigation/                  # Navigation components
│   ├── AppBreadcrumbs.tsx       # Breadcrumb navigation
│   ├── AppNavigation.tsx        # Main navigation menu
│   └── UserMenu.tsx             # User dropdown menu
├── productivity/                # Productivity enhancement
│   ├── AtRiskObjectivesWidget.tsx # Risk identification
│   ├── NotificationsFeed.tsx    # Real-time notifications
│   └── TeamProgressWidget.tsx   # Team progress overview
├── providers.tsx                # React context providers
├── reports/                     # Report generation components
│   └── ExportButton.tsx         # Data export controls
├── ClientLayout.tsx             # Client-side layout wrapper
├── ErrorBoundary.tsx            # Error boundary component
└── ...
```

### Business Logic Layer (`/lib/`)

#### Domain-Driven Design Implementation
```
lib/
├── auth.ts                      # Authentication utilities
├── rbac.ts                      # Role-based access control
├── org.ts                       # Organization management
├── okr.ts                       # OKR business logic
├── progress.ts                  # Progress calculation algorithms
├── checkin-summary.ts           # Check-in aggregation logic
├── notifications.ts             # Notification delivery system
├── mailer.ts                    # Email infrastructure
├── scheduler.ts                 # Background job orchestration
├── rateLimit.ts                 # API rate limiting
├── validation.ts                # Input validation schemas
├── apiError.ts                  # Standardized error handling
├── prisma.ts                    # Database client configuration
├── ui.ts                        # UI utility functions
├── utils.ts                     # General-purpose utilities
├── logger.ts                    # Structured logging system
├── performance.ts               # Performance monitoring
├── navigation.ts                # Route and navigation utilities
├── idp.ts                       # Identity provider management
├── sso.ts                       # SSO integration utilities
├── invitations.ts               # User invitation system
├── jobs.ts                      # Background job definitions
├── exporters.ts                 # Data export functionality
├── notificationSettings.ts      # User notification preferences
├── orgSettings.ts               # Organization configuration
├── isoWeek.ts                   # ISO week calculation utilities
├── india.ts                     # Regional localization (India)
├── demo/                        # Demo data and utilities
│   ├── api.ts                   # Demo API responses
│   ├── data.ts                  # Sample data generators
│   └── state.ts                 # Demo state management
├── __tests__/                   # Unit test utilities
│   ├── checkin-summary.test.ts  # Check-in logic tests
│   └── rateLimit.test.ts        # Rate limiting tests
├── schemas.ts                   # Zod validation schemas
└── ...
```

### Configuration Layer (`/config/`, `/prisma/`, `/types/`)

#### Feature Flag System (`/config/features.ts`)
```typescript
// Centralized feature toggling with environment overrides
export const featureFlags = {
  prdMode: process.env.NEXT_PUBLIC_PRD_MODE !== 'false',
  isFeatureEnabled: (key: FeatureKey) => {
    // Environment override pattern
    const envOverride = process.env[`NEXT_PUBLIC_ENABLE_${key.toUpperCase()}`]
    return featureDefaults[key] || envOverride === 'true'
  }
}
```

#### Database Schema (`/prisma/schema.prisma`)
```prisma
// Multi-tenant schema with row-level security
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core entities with relationships
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique // Multi-tenant identifier
  // ... additional fields
}

model User {
  id            String    @id @default(cuid())
  organizationId String   // Foreign key relationship
  // ... user fields
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@index([organizationId, role]) // Query optimization
}
```

#### Type Definitions (`/types/`)
```typescript
// NextAuth.js type extensions
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      organizationId: string
    } & DefaultSession["user"]
  }
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
  }
}
```

### Testing Infrastructure (`/e2e/`, `/tests-e2e/`, `/lib/__tests__/`)

#### End-to-End Test Suite (`/e2e/`)
```
e2e/
├── a11y.spec.ts                 # Accessibility compliance tests
├── assignment-flow.spec.ts      # OKR assignment workflows
├── checkins.spec.ts            # Check-in functionality tests
├── keyboard-nav.spec.ts        # Keyboard navigation tests
├── notifications.spec.ts       # Notification system tests
└── okrs.spec.ts                # OKR CRUD operations tests
```

#### Unit Test Structure (`/lib/__tests__/`)
```typescript
// Business logic testing
describe('checkin-summary', () => {
  describe('calculateProgress', () => {
    it('should calculate weighted progress correctly', () => {
      // Test implementation
    })
  })
})
```

### Development and Build Configuration

#### TypeScript Configuration (`/tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Build and Development Scripts (`/package.json`)
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

## Development Workflow

### Getting Started with Development

1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd okr-builder
   npm install
   cp .env.example .env.local
   # Configure your .env.local
   ```

2. **Database Setup**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed
   ```

3. **Start Development**:
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

### Code Quality

#### Testing
```bash
# Run unit tests
npm test

# Run e2e tests
npx playwright test

# Run accessibility tests
npx playwright test e2e/a11y.spec.ts
```

#### Code Quality Checks
```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Format code (if prettier is configured)
npx prettier --write .
```

### Contributing

1. **Fork and Clone**:
   - Fork the repository on GitHub
   - Clone your fork locally

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```

3. **Development Process**:
   - Write tests for new features
   - Follow existing code patterns and conventions
   - Keep commits focused and descriptive
   - Test your changes thoroughly

4. **Before Submitting**:
   ```bash
   # Run all checks
   npm run lint
   npm test
   npx playwright test

   # Ensure database migrations are created if needed
   npx prisma migrate dev
   ```

5. **Submit Pull Request**:
   - Push your branch to your fork
   - Create a pull request with a clear description
   - Reference any related issues
   - Wait for code review and CI checks

### Database Changes

When making database schema changes:

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name your-migration-name`
3. Update seed data if needed: `prisma/seed.ts`
4. Test migrations in development

### API Documentation

API endpoints are documented in `docs/API.md`. When adding new endpoints:

1. Add proper TypeScript types
2. Include request/response examples
3. Document authentication requirements
4. Add to `docs/API.md`

### Environment Setup for Contributors

Contributors should set up their environment with:

- Node.js 18+
- PostgreSQL (local or Docker)
- All environment variables from `.env.example`
- Optional: SSO providers for testing

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset database (development only)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

#### Authentication Issues
- Ensure `NEXTAUTH_URL` matches your development URL
- Check `NEXTAUTH_SECRET` is set
- For production SSO, verify provider credentials

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### Environment Variables
- Copy `.env.example` to `.env.local`
- Never commit `.env.local` to version control
- Use different values for development/production

### Performance Optimization

- Use `npm run warmup` for faster development navigation
- Enable React DevTools for debugging
- Check network tab for slow API calls
- Use `npx prisma studio` to inspect database queries

### Getting Help

- Check existing GitHub issues
- Review `docs/API.md` for API details
- Run tests to ensure your setup is correct
- Check database logs for migration issues

## License

This project is licensed under the MIT License.
