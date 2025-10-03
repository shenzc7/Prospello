'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import { AppHeader } from '@/components/navigation/AppHeader'
import { AppSidebar } from '@/components/navigation/AppSidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { buildNavItems } from '@/lib/navigation'

type ClientLayoutProps = {
  children: ReactNode
  envLabel?: string
}

export function ClientLayout({ children, envLabel }: ClientLayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Auth pages should manage their own layout completely
  const isAuthPage = pathname?.startsWith('/login')

  // If we're on an auth page, just render children without any layout wrapper
  if (isAuthPage) {
    return (
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    )
  }

  // If we have a session, show full layout regardless of loading state
  // This prevents the flash of unauthenticated layout
  if (session?.user) {
    const navItems = buildNavItems(session.user.role)

    return (
      <div className="relative h-screen flex">
        <AppSidebar items={navItems} envLabel={envLabel} user={session.user} />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <AppHeader user={session.user} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // If we're still loading and don't have a session, show simple layout
  if (status === 'loading') {
    return (
      <ErrorBoundary>
        <div className="flex flex-1 flex-col">{children}</div>
      </ErrorBoundary>
    )
  }

  // User is not authenticated - show simple layout for non-auth pages
  return (
    <ErrorBoundary>
      <div className="flex flex-1 flex-col">{children}</div>
    </ErrorBoundary>
  )
}
