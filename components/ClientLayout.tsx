'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ReactNode, memo } from 'react'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { buildNavItems } from '@/lib/navigation'
import { AppHeader } from '@/components/navigation/AppHeader'


type ClientLayoutProps = {
  children: ReactNode
  envLabel?: string
}

// Memoized header to prevent re-renders
const MemoizedHeader = memo(function MemoizedHeader({
  user,
  navItems,
  envLabel,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null } | undefined
  navItems: ReturnType<typeof buildNavItems>
  envLabel?: string
}) {
  return <AppHeader user={user} navItems={navItems} envLabel={envLabel} />
})



export function ClientLayout({ children, envLabel }: ClientLayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Auth pages render without any layout chrome
  const isAuthPage = pathname?.startsWith('/login')
  if (isAuthPage) {
    return <ErrorBoundary>{children}</ErrorBoundary>
  }

  // Show minimal loading state - don't block rendering
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[52px] border-b border-border/40 bg-background/95 backdrop-blur-xl" />
        <main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>
        </main>
      </div>
    )
  }

  // Authenticated user - show full app layout
  if (session?.user) {
    const navItems = buildNavItems(session.user.role)

    return (
      <div className="min-h-screen bg-background">
        <MemoizedHeader user={session.user} navItems={navItems} envLabel={envLabel} />
        <main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    )
  }

  // Not authenticated - middleware will redirect
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  )
}
