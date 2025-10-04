import { compare } from 'bcryptjs'
import { NextAuthOptions, Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
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

        if (!user) {
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
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.orgId = user.orgId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.orgId = token.orgId
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login'
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
