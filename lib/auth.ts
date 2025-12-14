import { compare } from 'bcryptjs'
import { NextAuthOptions, Session } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { generateUniqueOrgSlug } from '@/lib/org'
import { loadTenantProviders } from '@/lib/idp'

// =============================================================================
// AUTH PROVIDER CONFIGURATION
// =============================================================================
// SSO providers are configured via environment variables. See .env for setup
// instructions for each provider (Google, Slack, Microsoft Azure AD).
//
// To enable a provider, set its CLIENT_ID and CLIENT_SECRET in .env
// To disable password auth, set ALLOW_PASSWORD_AUTH=false
// To require SSO only, set REQUIRE_SSO=true
// =============================================================================

function buildEnvProviders(): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = []
  const allowPasswordAuth = process.env.ALLOW_PASSWORD_AUTH !== 'false' // default: enabled
  const requireSso = process.env.REQUIRE_SSO === 'true' // default: not required
  const configuredSso: string[] = []

  // Google SSO
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }))
    configuredSso.push('Google')
  }

  // Slack SSO
  if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) {
    providers.push(SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
    }))
    configuredSso.push('Slack')
  }

  // Microsoft Azure AD SSO
  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    providers.push(AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }))
    configuredSso.push('Azure AD')
  }

  // Log SSO configuration status (only in development)
  if (process.env.NODE_ENV === 'development') {
    if (configuredSso.length > 0) {
      console.log(`✓ SSO enabled: ${configuredSso.join(', ')}`)
    } else {
      console.log('○ SSO not configured (optional - see .env for setup instructions)')
    }
  }

  // Warn if SSO is required but none configured
  if (requireSso && configuredSso.length === 0) {
    console.warn('⚠ REQUIRE_SSO=true but no SSO provider is configured. Users cannot log in!')
  }

  // Password/credentials authentication
  if (allowPasswordAuth) {
    providers.push(
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { org: true }
          })

          if (!user || !user.passwordHash) {
            return null
          }

          const isValidPassword = await compare(credentials.password, user.passwordHash)

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            orgId: user.orgId || undefined,
          }
        }
      })
    )
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Password authentication enabled')
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('○ Password authentication disabled (SSO only)')
    }
  }

  return providers
}

const envProviders = buildEnvProviders()

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: envProviders,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      // Always hydrate latest role/org in case of SSO onboarding
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, orgId: true },
        })

        token.role = dbUser?.role || token.role || Role.EMPLOYEE
        token.orgId = dbUser?.orgId || token.orgId
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.orgId = token.orgId as string | undefined
      }
      return session
    },
    async signIn({ user }) {
      if (!user?.email) return false

      // Ensure every account has an org and default role
      await ensureOrgAndRole(user.id as string, user.email, user.name || undefined)
      return true
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login'
  },
  events: {
    async createUser({ user }) {
      if (user?.email) {
        await ensureOrgAndRole(user.id as string, user.email, user.name || undefined)
      }
    },
  },
}

type AuthProvider = NextAuthOptions['providers'][number]

function mergeProviders(base: NextAuthOptions['providers'], extras: NextAuthOptions['providers']): NextAuthOptions['providers'] {
  const providerMap = new Map<string | null, AuthProvider>()
  base.forEach((provider) => {
    providerMap.set(provider.id, provider)
  })
  extras.forEach((provider) => {
    providerMap.set(provider.id, provider)
  })
  return Array.from(providerMap.values())
}

export async function authOptionsForOrg(orgSlug?: string): Promise<NextAuthOptions> {
  if (!orgSlug) return authOptions
  const tenantProviders = await loadTenantProviders(orgSlug)
  if (!tenantProviders.length) return authOptions

  return {
    ...authOptions,
    providers: mergeProviders(envProviders, tenantProviders),
  }
}

export async function ensureOrgAndRole(userId: string, email: string, name?: string | null) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, orgId: true, passwordHash: true, email: true },
  })

  if (!existing) return null

  let orgId = existing.orgId
  let orgExists = false

  if (orgId) {
    orgExists = Boolean(
      await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true },
      })
    )
    if (!orgExists) {
      orgId = null
    }
  }

  if (!orgId) {
    const address = email || existing.email || 'okrflow.local'
    const domain = address.split('@')[1] || 'okrflow.local'
    const orgName = `${domain.split('.').shift() || 'Org'} Workspace`
    const slug = await generateUniqueOrgSlug(orgName)
    const org = await prisma.organization.create({ data: { name: orgName, slug } })
    orgId = org.id
    orgExists = true
  }

  const needsRoleOrOrgUpdate = !existing.orgId || !orgExists || existing.role !== Role.EMPLOYEE || existing.passwordHash === null

  if (needsRoleOrOrgUpdate) {
    const newRole = existing.orgId && orgExists ? (existing.role || Role.EMPLOYEE) : Role.ADMIN
    await prisma.user.update({
      where: { id: userId },
      data: {
        orgId,
        role: newRole,
        passwordHash: existing.passwordHash ?? '',
        name: existing?.orgId && orgExists ? undefined : name,
      },
    })
  }

  return orgId
}

export function roleGuard(session: Session | null, requiredRole: Role | Role[]): boolean {
  if (!session?.user?.role) {
    return false;
  }

  const userRole = session.user.role;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }

  return userRole === requiredRole;
}

// Session helpers
export function getUserFromSession(session: Session | null) {
  return session?.user || null
}

export function getUserRole(session: Session | null): Role | null {
  return session?.user?.role || null
}

export function getUserOrgId(session: Session | null): string | null {
  return session?.user?.orgId || null
}

export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user
}

export function hasRole(session: Session | null, role: Role | Role[]): boolean {
  return roleGuard(session, role)
}
