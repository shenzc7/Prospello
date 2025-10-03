import { Role } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      orgId?: string
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    orgId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role
    orgId?: string
  }
}
