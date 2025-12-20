import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup']

// Auth API routes that should always be accessible
const authApiRoutes = ['/api/auth']

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow auth API routes
  if (authApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow static files and other Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Redirect authenticated users away from login page
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Redirect unauthenticated users to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
