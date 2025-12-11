import { compare } from 'bcryptjs'
import { NextAuthOptions, Session } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const providers: NextAuthOptions['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
} else {
  console.warn('Google SSO is not configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET to enable.')
}

if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) {
  providers.push(SlackProvider({
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
  }))
} else {
  console.warn('Slack SSO is not configured. Set SLACK_CLIENT_ID/SLACK_CLIENT_SECRET to enable.')
}

if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
  providers.push(AzureADProvider({
    clientId: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    tenantId: process.env.AZURE_AD_TENANT_ID,
  }))
} else {
  console.warn('Azure AD SSO is not configured. Set AZURE_AD_CLIENT_ID/AZURE_AD_CLIENT_SECRET to enable.')
}

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

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers,
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
  }
}

async function ensureOrgAndRole(userId: string, email: string, name?: string | null) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, orgId: true, passwordHash: true },
  })

  if (!existing) return

  let orgId = existing.orgId

  if (!orgId) {
    const domain = email.split('@')[1] || 'okrflow.local'
    const orgName = `${domain.split('.').shift() || 'Org'} Workspace`
    const org = await prisma.organization.findFirst({ where: { name: orgName } }) ??
      await prisma.organization.create({ data: { name: orgName } })
    orgId = org.id
  }

  if (!existing.orgId || existing.role !== Role.EMPLOYEE || existing.passwordHash === null) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        orgId,
        role: existing.role || Role.EMPLOYEE,
        passwordHash: existing.passwordHash ?? '',
        name: existing?.orgId ? undefined : name,
      },
    })
  }
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
