import { NextResponse } from 'next/server'
import { isRoleAllowedForRoute } from '@/lib/rbac'
import { createErrorResponse, APIError } from '@/lib/apiError'
import { getToken } from 'next-auth/jwt'

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_REQUESTS = 60 // requests
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    // First request or window expired, reset
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    return false
  }

  record.count++
  return true
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  // Fallback to a default for localhost/dev
  return '127.0.0.1'
}

export default async function middleware(req: any) {
  const { pathname } = req.nextUrl

  // Handle API routes with rate limiting only (no auth check)
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(req)

    if (!checkRateLimit(clientIP)) {
      const resetIn = Math.ceil((rateLimitStore.get(clientIP)!.resetTime - Date.now()) / 1000)
      return createErrorResponse(new APIError('RATE_LIMIT_EXCEEDED', 'Too many requests', { resetIn }))
    }

    // API routes don't need auth middleware here - auth is handled in each route
    return NextResponse.next()
  }

  // Handle app routes with auth
  const token = await getToken({ req })

  // If no token and not on login/auth pages, redirect to login
  if (!token && !pathname.startsWith('/login') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/my-okrs')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check RBAC for admin routes
  if (pathname.startsWith('/admin') && token && !isRoleAllowedForRoute(token.role as any, pathname)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
