import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'

import { authOptions, authOptionsForOrg } from '@/lib/auth'

export const runtime = 'nodejs'

async function handler(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  const url = req.nextUrl || new URL(req.url || '', 'http://localhost:3000')
  const orgSlug = url.searchParams.get('org') || req.headers.get('x-org-slug') || undefined
  const options = orgSlug ? await authOptionsForOrg(orgSlug) : authOptions

  return NextAuth(req, context, options)
}

export { handler as GET, handler as POST }
