# Enterprise Contribution Guidelines - OKRFlow

## Professional Collaboration Standards

OKRFlow operates as an enterprise-grade platform with rigorous development standards and architectural patterns. Contributions must adhere to production-quality engineering practices, comprehensive testing requirements, and enterprise security considerations.

### Code of Professional Conduct

As a contributor to OKRFlow, you are expected to maintain the highest standards of professional software development:

**Engineering Excellence:**
- Deliver production-ready code with comprehensive test coverage
- Implement robust error handling and logging mechanisms
- Follow established architectural patterns and design principles
- Ensure backward compatibility and migration safety

**Security and Compliance:**
- Implement secure coding practices with input validation and sanitization
- Respect data privacy regulations and organizational boundaries
- Maintain audit trails for sensitive operations
- Follow principle of least privilege in access controls

**Collaboration Standards:**
- Provide constructive, technical feedback on design decisions
- Document architectural changes and rationale
- Participate in thorough code review processes
- Maintain clear communication channels with stakeholders

**Quality Assurance:**
- Write comprehensive unit and integration tests
- Perform security testing and vulnerability assessments
- Validate performance implications of changes
- Ensure accessibility compliance (WCAG 2.1 AA standards)

## Enterprise Development Workflow

### Repository Access and Setup

#### 1. Repository Forking and Cloning

**Enterprise Repository Management:**
```bash
# Create a fork in your organization's GitHub account
# Clone with SSH for secure authentication
git clone git@github.com:your-org/okr-builder.git
cd okr-builder

# Set upstream remote for synchronization
git remote add upstream git@github.com:original-org/okr-builder.git
git fetch upstream
```

**Branch Protection Strategy:**
- `main`: Protected branch requiring PR approval and CI checks
- `develop`: Integration branch for feature development
- `release/*`: Release preparation branches
- Feature branches follow pattern: `feature/ISSUE-123-description`
- Hotfix branches follow pattern: `hotfix/ISSUE-456-description`

#### 2. Development Environment Initialization

**Prerequisites Validation:**
```bash
# Node.js version verification
node --version  # Must be 18.17.0+
npm --version   # Must be 9.0+

# PostgreSQL connectivity test
pg_isready -h localhost -p 5432

# Git configuration verification
git config --list --show-origin
```

**Secure Environment Setup:**
```bash
# Copy environment template
cp .env.example .env.local

# Generate secure secrets (production-grade)
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For CRON_SECRET

# Configure database connection
export DATABASE_URL="postgresql://user:pass@localhost:5432/okrflow"

# Initialize development database
npm run db:generate
npm run db:migrate
npm run db:seed
```

#### 3. Feature Branch Strategy

**Git Flow Implementation:**
```bash
# Create feature branch from develop
git checkout develop
git pull upstream develop
git checkout -b feature/ISSUE-123-user-sso-integration

# Regular synchronization with upstream
git fetch upstream
git rebase upstream/develop

# Commit strategy (atomic, descriptive)
git add -A
git commit -m "feat(auth): implement Google Workspace SSO integration

- Add Google OAuth 2.0 provider configuration
- Implement organization-specific IdP mapping
- Add user provisioning with role assignment
- Include comprehensive error handling

Closes ISSUE-123"
```

**Branch Naming Conventions:**
- `feature/ISSUE-NNN-description`: New functionality
- `bugfix/ISSUE-NNN-description`: Bug fixes
- `hotfix/ISSUE-NNN-critical-fix`: Production hotfixes
- `refactor/component-optimization`: Code refactoring
- `docs/api-documentation`: Documentation updates

#### 4. Implementation Standards

**Code Architecture Requirements:**
```typescript
// Example: Service layer pattern implementation
// /lib/services/userService.ts
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async createUser(input: CreateUserInput): Promise<User> {
    // Input validation with Zod schemas
    const validatedInput = CreateUserSchema.parse(input)

    // Business logic with error handling
    try {
      const user = await this.prisma.user.create({
        data: {
          ...validatedInput,
          // Audit fields
          createdBy: this.getCurrentUserId(),
          createdAt: new Date(),
        },
      })

      // Event publishing for audit trail
      await this.auditLog.log('USER_CREATED', { userId: user.id })

      return user
    } catch (error) {
      // Structured error handling
      throw new ServiceError('USER_CREATION_FAILED', {
        cause: error,
        context: { input: validatedInput }
      })
    }
  }
}
```

**Security Implementation Requirements:**
```typescript
// Input sanitization and validation
import { z } from 'zod'

const CreateObjectiveSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  type: z.enum(['COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL']),
  startDate: z.date().refine(date => date >= new Date(), {
    message: "Start date cannot be in the past"
  }),
  endDate: z.date(),
  ownerId: z.string().uuid(),
  organizationId: z.string().uuid(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
})

// SQL injection prevention (handled by Prisma)
// XSS prevention (handled by React and sanitization)
// CSRF protection (handled by NextAuth.js)
```

#### 5. Quality Assurance Pipeline

**Automated Testing Requirements:**
```bash
# Unit test coverage (minimum 80%)
npm run test:unit
# - Business logic functions
# - Utility functions
# - Component logic (where applicable)

# Integration test suite
npm run test:integration
# - API endpoint testing
# - Database operations
# - External service integrations

# End-to-end test validation
npm run test:e2e
# - Critical user journeys
# - Accessibility compliance
# - Cross-browser compatibility

# Security testing
npm run test:security
# - Dependency vulnerability scanning
# - Static application security testing (SAST)
# - Input validation testing
```

**Performance Benchmarking:**
```bash
# Load testing baseline
npm run test:load
# - API response times < 100ms
# - Database query optimization
# - Memory usage monitoring

# Bundle size analysis
npm run analyze:bundle
# - JavaScript bundle < 500KB (gzipped)
# - CSS bundle optimization
# - Image optimization verification
```

#### 6. Pull Request Submission Protocol

**PR Preparation Checklist:**
```bash
# Pre-submission validation
✅ npm run lint                    # Code style compliance
✅ npm run type-check             # TypeScript compilation
✅ npm run test:unit              # Unit test coverage > 80%
✅ npm run test:integration       # Integration tests pass
✅ npm run build                  # Production build succeeds
✅ npm run test:e2e               # E2E tests pass
✅ npm run test:security          # Security scan clean
✅ npm run test:accessibility     # WCAG 2.1 AA compliant
```

**Enterprise PR Template:**
```markdown
## 🎯 **Change Overview**
[Brief description of the change and business impact]

## 🏗️ **Architecture Changes**
- [ ] Database schema modifications
- [ ] API endpoint additions/modifications
- [ ] Authentication/authorization changes
- [ ] External service integrations

## 🔒 **Security Considerations**
- [ ] Input validation implemented
- [ ] Authentication/authorization verified
- [ ] Data privacy compliance maintained
- [ ] Audit logging included

## 🧪 **Testing Strategy**
- [ ] Unit tests added/updated
- [ ] Integration tests included
- [ ] E2E test coverage verified
- [ ] Performance impact assessed

## 📊 **Performance Impact**
- [ ] Database query optimization reviewed
- [ ] Bundle size impact minimal
- [ ] API response times maintained
- [ ] Memory usage acceptable

## 🚀 **Deployment Notes**
- [ ] Database migrations included
- [ ] Environment variables documented
- [ ] Rollback strategy defined
- [ ] Monitoring alerts configured

## 📝 **Documentation Updates**
- [ ] README.md updated if needed
- [ ] API documentation updated
- [ ] User-facing documentation updated

## 🔗 **Related Issues**
Closes #ISSUE-NUMBER
Related to #ISSUE-NUMBER

## ✅ **Checklist**
- [ ] Self-review completed
- [ ] Code review requested
- [ ] CI/CD pipeline passes
- [ ] Security review completed
- [ ] Product acceptance criteria met
```

## Enterprise Architecture Framework

### Technology Stack Architecture

**Frontend Layer - Next.js 15 Application Platform:**
```typescript
// App Router with Server Components architecture
app/
├── layout.tsx                    // Root layout with providers
├── (auth)/                       // Route groups for authentication
├── (app)/                        // Protected routes with middleware
├── api/                          // Server-side API routes
└── error.tsx                     // Global error boundaries
```

**Data Layer - Prisma ORM with PostgreSQL:**
```prisma
// Type-safe database operations with connection pooling
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT")  // For migrations
}

// Generated TypeScript client with full type safety
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['error'],
})
```

**Authentication Layer - NextAuth.js Enterprise SSO:**
```typescript
// Multi-provider SSO with session management
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Additional enterprise providers...
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  callbacks: {
    // Enterprise authorization logic
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    }
  }
}
```

**Testing Infrastructure - Comprehensive Quality Assurance:**
```typescript
// Jest configuration with enterprise standards
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Multi-Tenant Architecture Implementation

**Organization-Based Data Isolation:**
```typescript
// Row-level security implementation
model User {
  id            String @id @default(cuid())
  organizationId String
  // All user data scoped to organization

  organization Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId, email]) // Query optimization
}

// Middleware enforcement
export async function middleware(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const orgId = session?.user?.organizationId

  if (!orgId) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Organization-scoped data access enforced
}
```

**Identity Provider Mapping:**
```typescript
// Organization-specific SSO configuration
model IdentityProviderConfig {
  id             String @id @default(cuid())
  organizationId String
  provider       ProviderType
  clientId       String
  clientSecret   String @db.Text
  issuer         String?

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, provider])
}
```

### Domain-Driven Design Implementation

**Core Business Domains:**
- **Authentication & Authorization**: Multi-tenant SSO with RBAC
- **Organization Management**: Company structure and user provisioning
- **OKR Management**: Objective lifecycle and progress tracking
- **Progress Analytics**: Reporting and visualization systems
- **Notification System**: Multi-channel communication infrastructure
- **Integration Layer**: External service connections and webhooks

**Clean Architecture Layers:**
```
┌─────────────────────────────────────┐
│       Presentation Layer           │
│   (Next.js Pages, React Components) │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│       Application Layer            │
│   (API Routes, Controllers)        │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│       Domain Layer                 │
│   (Business Logic, Entities)       │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│       Infrastructure Layer         │
│   (Database, External Services)    │
└─────────────────────────────────────┘
```

### Performance and Scalability Architecture

**Database Optimization Strategies:**
```sql
-- Strategic indexing for query performance
CREATE INDEX CONCURRENTLY idx_objectives_org_status
ON objectives(organization_id, status)
WHERE deleted_at IS NULL;

-- Connection pooling configuration
-- DATABASE_URL with connection_limit=20
-- Read replica support for analytics queries
```

**Caching Architecture:**
```typescript
// Multi-layer caching strategy
import { Redis } from '@upstash/redis'

// Session storage
const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

// Application-level caching with TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
    },
  },
})
```

**CDN and Edge Computing:**
```javascript
// Next.js configuration for edge deployment
// next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  images: {
    domains: ['cdn.okrflow.com'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### Security Architecture

**Authentication & Authorization:**
```typescript
// Role-based access control with permissions
export const permissions = {
  OBJECTIVE_CREATE: 'objective:create',
  USER_MANAGE: 'user:manage',
  ORGANIZATION_ADMIN: 'organization:admin',
} as const

export function hasPermission(
  user: User,
  permission: keyof typeof permissions
): boolean {
  // Permission evaluation logic
  return user.role === 'ADMIN' ||
         (user.role === 'MANAGER' && permission !== 'USER_MANAGE')
}
```

**Data Protection and Privacy:**
```typescript
// Data encryption at rest
import { encrypt, decrypt } from '@/lib/crypto'

export async function createUser(data: CreateUserInput) {
  const encryptedEmail = await encrypt(data.email)

  return prisma.user.create({
    data: {
      ...data,
      email: encryptedEmail,
    }
  })
}
```

**API Security:**
```typescript
// Rate limiting and abuse prevention
import rateLimit from '@/lib/rateLimit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')
  const { success } = await rateLimit.limit(ip!)

  if (!success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // API logic continues...
}
```

## Enterprise Development Standards

### Code Architecture and Design Patterns

#### TypeScript Enterprise Standards

**Strict Type Safety Implementation:**
```typescript
// Comprehensive type definitions with branded types
type UserId = string & { readonly __brand: 'UserId' }
type OrganizationId = string & { readonly __brand: 'OrganizationId' }

// Domain-specific types with validation
interface OKRObjective {
  readonly id: ObjectiveId
  readonly title: string
  readonly description?: string
  readonly type: GoalType
  readonly status: ObjectiveStatus
  readonly progress: Progress
  readonly timeFrame: TimeFrame
  readonly owner: UserReference
  readonly organization: OrganizationReference
  readonly keyResults: readonly KeyResult[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

// Generic result type for error handling
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// Functional programming patterns
export function validateObjective(input: unknown): Result<OKRObjective> {
  try {
    const objective = ObjectiveSchema.parse(input)
    return { success: true, data: objective }
  } catch (error) {
    return { success: false, error: new ValidationError(error) }
  }
}
```

**ESLint Configuration for Enterprise Code Quality:**
```javascript
// eslint.config.js - Enterprise-grade linting
export default [
  {
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'import': importPlugin,
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Import organization
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],

      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
]
```

#### Component Architecture Patterns

**Atomic Design with Compound Components:**
```tsx
// atoms/Button.tsx - Base atomic component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

// molecules/ObjectiveCard.tsx - Molecular composition
interface ObjectiveCardProps {
  objective: OKRObjective
  onEdit?: (id: ObjectiveId) => void
  onDelete?: (id: ObjectiveId) => void
}

export function ObjectiveCard({
  objective,
  onEdit,
  onDelete
}: ObjectiveCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{objective.title}</h3>
          <p className="text-muted-foreground mt-1">
            {objective.description}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(objective.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(objective.id)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ObjectiveProgress
        progress={objective.progress}
        className="mt-4"
      />

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>Owner: {objective.owner.name}</span>
        <ObjectiveStatusBadge status={objective.status} />
      </div>
    </Card>
  )
}
```

**Custom Hook Patterns for Business Logic:**
```tsx
// hooks/useObjectives.ts - Data fetching with error handling
interface UseObjectivesOptions {
  organizationId: OrganizationId
  status?: ObjectiveStatus
  ownerId?: UserId
  page?: number
  limit?: number
}

export function useObjectives(options: UseObjectivesOptions) {
  return useQuery({
    queryKey: ['objectives', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, String(value))
        }
      })

      const response = await fetch(`/api/objectives?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch objectives')
      }

      return response.json() as Promise<{
        objectives: OKRObjective[]
        total: number
        page: number
        limit: number
      }>
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) {
        return false
      }
      return failureCount < 3
    },
  })
}

// hooks/useObjectiveMutations.ts - Data mutations with optimistic updates
export function useObjectiveMutations() {
  const queryClient = useQueryClient()

  const createObjective = useMutation({
    mutationFn: async (input: CreateObjectiveInput) => {
      const response = await fetch('/api/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create objective')
      }

      return response.json()
    },
    onSuccess: (newObjective) => {
      // Optimistic update
      queryClient.setQueryData(
        ['objectives', { organizationId: newObjective.organizationId }],
        (old: any) => ({
          ...old,
          objectives: [newObjective, ...(old?.objectives || [])],
        })
      )

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
    },
    onError: (error) => {
      // Error handling and user feedback
      toast.error(`Failed to create objective: ${error.message}`)
    },
  })

  return { createObjective }
}
```

#### Naming Conventions
```typescript
// Components: PascalCase
export function ObjectiveCard() { }

// Hooks: camelCase with 'use' prefix
export function useObjectives() { }

// Types: PascalCase with descriptive names
export interface CreateObjectiveRequest { }

// Constants: UPPER_SNAKE_CASE
export const MAX_OBJECTIVES_PER_USER = 10;

// Files: kebab-case for components, camelCase for utilities
// components/objective-card.tsx
// lib/objectiveUtils.ts
```

### Component Development

#### React Best Practices
- Use functional components with hooks (no class components)
- Implement proper TypeScript interfaces for props
- Follow established component structure patterns
- Use custom hooks for shared logic
- Implement proper error boundaries

#### UI Components
- Use shadcn/ui components from `components/ui/`
- Ensure accessibility (ARIA labels, keyboard navigation)
- Follow design system color schemes and spacing
- Test components across different screen sizes
- Use proper loading states and error handling

#### Component Organization
```
components/
├── feature-name/           # Feature-specific components
│   ├── ComponentName.tsx   # Main component
│   ├── component-name.test.tsx  # Unit tests
│   └── index.ts            # Barrel exports
```

### API Development

#### REST API Patterns
- Use RESTful conventions with proper HTTP methods
- Implement proper error handling with consistent response formats
- Add input validation using Zod schemas
- Include proper TypeScript types for requests/responses
- Document all endpoints in `docs/API.md`

#### Database Operations
- Use Prisma client for all database operations
- Implement proper transaction handling for complex operations
- Add database indexes for frequently queried fields
- Use Prisma's type safety features
- Test database operations thoroughly

### Database Changes

#### Migration Process
```bash
# Update schema
# Edit prisma/schema.prisma

# Create migration
npx prisma migrate dev --name descriptive-migration-name

# Generate client
npx prisma generate

# Update seed data if needed
# Edit prisma/seed.ts

# Test in development
npm run db:seed
```

#### Schema Best Practices
- Use descriptive field names and proper constraints
- Add database-level validation where appropriate
- Plan for future scalability (indexes, partitioning)
- Maintain backward compatibility
- Document schema changes

### Testing Strategy

#### Testing Pyramid
- **Unit Tests**: Utility functions, hooks, small components
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Critical user flows, authentication

#### Testing Guidelines
```bash
# Unit tests
npm test

# E2E tests
npx playwright test

# Accessibility tests
npx playwright test e2e/a11y.spec.ts

# Test coverage
npm test -- --coverage
```

#### Test Organization
- Place test files next to implementation files
- Use descriptive test names that explain behavior
- Test both success and error scenarios
- Mock external dependencies appropriately
- Aim for meaningful test coverage (>80%)

### Security Considerations

#### Authentication & Authorization
- Never expose sensitive data in client-side code
- Validate all user inputs on both client and server
- Implement proper session management
- Use HTTPS in production
- Regularly rotate secrets and API keys

#### Data Protection
- Implement proper data sanitization
- Use parameterized queries (handled by Prisma)
- Implement rate limiting for API endpoints
- Log security events appropriately
- Follow OWASP guidelines

### Performance Optimization

#### Frontend Performance
- Use React.memo for expensive components
- Implement proper code splitting with Next.js
- Optimize images and static assets
- Use proper caching strategies
- Monitor bundle size with `npm run build`

#### Database Performance
- Add appropriate database indexes
- Use pagination for large datasets
- Implement proper query optimization
- Cache frequently accessed data
- Monitor query performance with Prisma Studio

### Documentation

#### Code Documentation
- Add JSDoc comments for public APIs and complex functions
- Document component props and behavior
- Include examples in documentation
- Keep comments up-to-date with code changes

#### API Documentation
- Document all endpoints in `docs/API.md`
- Include request/response examples
- Specify authentication requirements
- Document error responses
- Update documentation with API changes

## Commit Message Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add Google OAuth integration

fix(dashboard): resolve progress calculation bug

docs(api): update endpoint documentation
```

## Pull Request Process

1. **Title**: Clear, descriptive title following conventional commit format
2. **Description**: Detailed explanation of changes
3. **Testing**: How to test the changes
4. **Screenshots**: For UI changes
5. **Breaking Changes**: Clearly marked if any
6. **Related Issues**: Reference issues this PR addresses

### Review Process

- At least one maintainer must review and approve
- All CI checks must pass
- Tests must pass
- Code follows project standards
- Documentation is updated

## Issue Reporting

When reporting bugs or requesting features:

- Use the appropriate issue template
- Provide detailed steps to reproduce
- Include environment information
- Add screenshots for UI issues
- Check for existing similar issues

## Local Development Setup

### Prerequisites
- Node.js 18 or later
- PostgreSQL 15+ (or Docker)
- Git

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd okr-builder

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL and secrets

# Set up database
npx prisma generate
npx prisma migrate dev
npm run db:seed

# Start development server
npm run dev

# Visit http://localhost:3000
```

### Development Workflows

#### Adding a New Feature
1. **Plan the feature** with user stories and acceptance criteria
2. **Create database changes** if needed
3. **Implement API endpoints** with proper validation
4. **Create UI components** following design patterns
5. **Add tests** for all new functionality
6. **Update documentation**
7. **Test end-to-end** before submitting PR

#### Fixing a Bug
1. **Reproduce the issue** locally
2. **Identify root cause** through debugging
3. **Write a test** that reproduces the bug
4. **Implement the fix**
5. **Verify the fix** with the test and manually
6. **Check for regressions** in related functionality

#### Database Schema Changes
1. **Update `prisma/schema.prisma`** with changes
2. **Create migration**: `npx prisma migrate dev --name descriptive-name`
3. **Update TypeScript types**: `npx prisma generate`
4. **Update seed data** if needed
5. **Test thoroughly** in development environment

### Debugging Tips

#### Frontend Debugging
- Use React DevTools for component inspection
- Enable source maps in browser developer tools
- Use `console.log` strategically (remove before committing)
- Check Network tab for failed API calls
- Use `npm run warmup` for faster route loading

#### Backend Debugging
- Check server logs in terminal running `npm run dev`
- Use `npx prisma studio` to inspect database state
- Add `console.log` in API routes for debugging
- Check browser Network tab for API request/response details
- Use Postman or similar for API testing

#### Database Debugging
```bash
# View database in browser
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# View raw SQL queries
npx prisma db push --preview-feature
```

### Code Review Checklist

#### Before Submitting PR
- [ ] Code follows project conventions and style
- [ ] All tests pass (`npm test`)
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript compiles without errors
- [ ] Database migrations created and tested
- [ ] Documentation updated
- [ ] No console.log statements left in code
- [ ] Proper error handling implemented

#### During Code Review
- [ ] Code is readable and well-documented
- [ ] Tests cover the new functionality
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] No breaking changes without proper migration
- [ ] Follows established patterns

## Setting Up Advanced Features

The codebase includes several powerful features that are implemented but require additional configuration to enable. These features are designed to work out-of-the-box once properly configured.

### Single Sign-On (SSO) Configuration

The application supports multi-tenant SSO with Google, Slack, Azure AD, and generic OIDC providers.

#### 1. Google OAuth Setup
```bash
# Add to .env.local
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# For production, configure in Google Cloud Console:
# 1. Go to https://console.cloud.google.com/
# 2. Create/select project
# 3. Enable Google+ API
# 4. Create OAuth 2.0 credentials
# 5. Add authorized redirect URIs:
#    - http://localhost:3000/api/auth/callback/google (dev)
#    - https://yourdomain.com/api/auth/callback/google (prod)
```

#### 2. Slack OAuth Setup
```bash
# Add to .env.local
SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"

# Setup in Slack:
# 1. Go to https://api.slack.com/apps
# 2. Create new app
# 3. Add OAuth scopes: users:read, identity.basic
# 4. Set redirect URI: https://yourdomain.com/api/auth/callback/slack
```

#### 3. Azure AD Setup
```bash
# Add to .env.local
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"

# Setup in Azure Portal:
# 1. Go to Azure Active Directory
# 2. App registrations → New registration
# 3. Set redirect URI: https://yourdomain.com/api/auth/callback/azure-ad
# 4. Note the Application (client) ID and Directory (tenant) ID
# 5. Create client secret in Certificates & secrets
```

#### 4. Generic OIDC Setup
For providers like Auth0, Okta, or Keycloak:
```javascript
// Configure via admin dashboard at /admin/idp
// POST to /api/idp with:
{
  "provider": "oidc",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "issuer": "https://your-oidc-provider.com"
}
```

#### 5. Organization-Specific SSO
```javascript
// Each organization can have its own SSO configuration
// Configure via admin dashboard or API:
// POST /api/idp (as admin user)
{
  "provider": "google",
  "clientId": "org-specific-client-id",
  "clientSecret": "org-specific-client-secret"
}

// Users can then login with org slug:
// https://yourdomain.com/login?org=your-org-slug
```

### Email System Configuration

#### SMTP Setup
```bash
# Add to .env.local
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="OKRFlow <noreply@yourcompany.com>"

# For Gmail: Use App Passwords, not your regular password
# 1. Enable 2FA on Gmail
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Use the 16-character password as SMTP_PASS
```

#### Popular SMTP Providers
```bash
# SendGrid
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"

# Mailgun
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="your-mailgun-smtp-username"
SMTP_PASS="your-mailgun-smtp-password"

# AWS SES
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-ses-smtp-username"
SMTP_PASS="your-ses-smtp-password"

# Resend
SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_USER="resend"
SMTP_PASS="your-resend-api-key"
```

#### Email Features Available
- **User Invitations**: Welcome emails with login credentials
- **Notifications**: Check-in reminders, comments, mentions
- **Password Reset**: Automated password recovery
- **Weekly Reports**: OKR progress summaries

### Automated Jobs & Scheduling

#### Cron Job Configuration
```bash
# Add to .env.local
CRON_SECRET="your-very-long-random-cron-secret-here"

# Internal scheduler (runs automatically)
SCHEDULER_INTERVAL_MS=900000  # 15 minutes
DISABLE_INTERNAL_SCHEDULER="false"

# External cron (recommended for production)
# Set up cron jobs to call these endpoints:
# - POST /api/cron/reminders?orgId=<ORG_ID>
# - POST /api/cron/scoring?orgId=<ORG_ID>
# Headers: x-cron-secret: $CRON_SECRET
```

#### Available Automated Jobs
- **Check-in Reminders**: Daily notifications for overdue check-ins
- **OKR Scoring**: Automatic end-of-cycle scoring calculations
- **Notification Cleanup**: Removes old notifications
- **Progress Updates**: Calculates objective progress based on KR updates

#### Setting Up External Cron (Recommended)
```bash
# Example cron configuration (runs daily at 9 AM)
0 9 * * * curl -X POST -H "x-cron-secret: YOUR_SECRET" \
  "https://yourdomain.com/api/cron/reminders?orgId=all"

# Vercel Cron (in vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/reminders?orgId=all",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/scoring?orgId=all",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Webhook Integrations

#### Slack Webhooks
```bash
# Add to .env.local
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Configure in Slack:
# 1. Go to Slack app settings
# 2. Add Incoming Webhooks
# 3. Create webhook for your channel
# 4. Copy webhook URL to env var
```

#### Microsoft Teams Webhooks
```bash
# Add to .env.local
TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/YOUR/WEBHOOK/URL"

# Configure in Teams:
# 1. Add "Incoming Webhook" connector to channel
# 2. Copy webhook URL to env var
```

#### Available Webhook Events
- **Check-in Due**: When users have overdue check-ins
- **OKR Updates**: When objectives or key results are updated
- **Comments**: When new comments are added
- **System Notifications**: Important system events

### Feature Flags & Advanced Configuration

#### Enabling Hidden Features
```bash
# Add to .env.local to enable specific features in PRD mode
NEXT_PUBLIC_ENABLE_APPEARANCE_SETTINGS="true"
NEXT_PUBLIC_ENABLE_THEME_TOGGLE="true"
NEXT_PUBLIC_ENABLE_DEMOMODE="true"

# Or disable PRD mode entirely (enables everything)
NEXT_PUBLIC_PRD_MODE="false"
```

#### Available Feature Flags
- `NEXT_PUBLIC_ENABLE_APPEARANCE_SETTINGS`: Theme and language settings
- `NEXT_PUBLIC_ENABLE_THEME_TOGGLE`: Light/dark mode toggle
- `NEXT_PUBLIC_ENABLE_DEMOMODE`: Demo data and controls
- `NEXT_PUBLIC_ENABLE_INTEGRATIONS`: External service placeholders
- `NEXT_PUBLIC_ENABLE_USER_SWITCHER`: Role switching for testing

### User Invitation System

#### Email Invitations
The system supports inviting users via email with automatic account creation:

```javascript
// As an admin, send invitations via API
POST /api/invitations
{
  "email": "newuser@company.com",
  "role": "EMPLOYEE",
  "expiresInDays": 14
}

// Or via admin dashboard at /admin/invitations
```

#### Invitation Flow
1. Admin creates invitation with email and role
2. System sends email with signup link
3. User clicks link and is pre-filled with email/org
4. User sets password and joins organization
5. Automatic team assignment if configured

### Notification System

#### User Notification Preferences
Users can configure when they receive notifications:
- Email frequency (immediate, daily digest, weekly)
- Quiet hours
- Notification types (check-ins, comments, mentions, system)

#### Admin Notification Settings
```javascript
// Configure via API or admin dashboard
PUT /api/settings/notifications
{
  "emailDigest": "daily",
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "notifyOnComments": true,
  "notifyOnMentions": true,
  "notifyOnCheckins": false
}
```

### Demo Mode Configuration

#### Setting Up Demo Data
```bash
# Enable demo mode
NEXT_PUBLIC_ENABLE_DEMOMODE="true"

# Seed demo data
npm run db:seed

# Demo accounts available:
# Admin: admin@techflow.dev / Pass@123
# Manager: manager@techflow.dev / Pass@123
# Employee: me@techflow.dev / Pass@123
```

#### Demo Features
- Pre-populated OKRs and teams
- Simulated check-in data
- Demo mode toggle in UI
- Safe for testing without affecting real data

### Production Deployment Checklist

#### Before Going Live
- [ ] Configure production database (not SQLite)
- [ ] Set up SMTP for email delivery
- [ ] Configure at least one SSO provider
- [ ] Set up external cron jobs
- [ ] Configure webhooks for notifications
- [ ] Set strong `NEXTAUTH_SECRET` and `CRON_SECRET`
- [ ] Configure proper domain in `NEXTAUTH_URL`
- [ ] Set up monitoring and logging
- [ ] Test all features end-to-end
- [ ] Configure backup strategy for database

#### Performance Optimization
```bash
# Database connection pooling (production)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&connection_limit=10"

# Redis for session storage (optional)
REDIS_URL="redis://localhost:6379"

# CDN for static assets
NEXT_PUBLIC_CDN_URL="https://cdn.yourdomain.com"
```

## Getting Help

- Check the [README.md](README.md) for setup and usage instructions
- Review `docs/API.md` for API documentation
- Search existing issues and pull requests
- Check the troubleshooting section in README
- Create a new issue for bugs or feature requests
- Join our community discussions (if available)

## Recognition

Contributors will be recognized in:
- Release notes
- Contributors file
- Project acknowledgments

Thank you for contributing to OKR Builder! 🎉
