'use client'

import { useSession } from 'next-auth/react'
import { ReactNode, useEffect, useState } from 'react'

import { AppHeader } from '@/components/navigation/AppHeader'
import { AppSidebar } from '@/components/navigation/AppSidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { buildNavItems } from '@/app/layout'

type ClientLayoutProps = {
  children: ReactNode
  envLabel?: string
}

export function ClientLayout({ children, envLabel }: ClientLayoutProps) {
  const { data: session, status } = useSession()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for hydration to complete
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Show loading state while hydrating
  if (!isHydrated || status === 'loading') {
    return (
      <ErrorBoundary>
        <div className="flex flex-1 flex-col">{children}</div>
      </ErrorBoundary>
    )
  }

  // User is authenticated - show full layout
  if (session?.user) {
    const navItems = buildNavItems(session.user.role)

    return (
      <>
        <AppSidebar items={navItems} envLabel={envLabel} user={session.user} />
        <div className="flex min-h-screen flex-1 flex-col lg:ml-0">
          <AppHeader navItems={navItems} user={session.user} />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:pl-6">
            <ErrorBoundary>
              <div className="flex-1">{children}</div>
            </ErrorBoundary>
          </main>
        </div>
      </>
    )
  }

  // User is not authenticated - show simple layout
  return (
    <ErrorBoundary>
      <div className="flex flex-1 flex-col">{children}</div>
    </ErrorBoundary>
  )
}
