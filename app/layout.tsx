import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'
// Icons are now handled in the Client Component to avoid serialization issues

import { AppHeader } from '@/components/navigation/AppHeader'
import { AppSidebar } from '@/components/navigation/AppSidebar'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { type AppNavItem } from '@/components/navigation/AppNavigation'
import { Providers } from '@/components/providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { strings } from '@/config/strings'
import { authOptions } from '@/lib/auth'

import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    default: strings.app.name,
    template: `%s | ${strings.app.name}`,
  },
  description: 'Project management and team collaboration for software development.',
}

const envLabel = process.env.NEXT_PUBLIC_APP_ENV
  ? process.env.NEXT_PUBLIC_APP_ENV
  : process.env.NODE_ENV === 'production'
    ? undefined
    : process.env.NODE_ENV?.toUpperCase()

function buildNavItems(role?: string): AppNavItem[] {
  const base: AppNavItem[] = [
    { href: '/', label: strings.navigation.items.company, icon: 'Target' },
    { href: '/teams', label: strings.navigation.items.teams, icon: 'UserRound' },
    { href: '/my-okrs', label: strings.navigation.items.myOkrs, icon: 'ClipboardList' },
  ]

  if (role === 'ADMIN' || role === 'MANAGER') {
    base.push({ href: '/reports', label: strings.navigation.items.reports, icon: 'BarChart3' })
  }

  if (role === 'ADMIN') {
    base.push({ href: '/admin/users', label: strings.navigation.items.settings, icon: 'ShieldCheck' })
  }

  return base
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  const navItems = session?.user ? buildNavItems(session.user.role) : []

  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`} suppressHydrationWarning>
      <body className="relative min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers session={session}>
          <div className="relative flex min-h-screen" suppressHydrationWarning>
            {session?.user ? (
              <>
                <AppSidebar items={navItems} envLabel={envLabel} user={session.user} />
                <div className="flex min-h-screen flex-1 flex-col lg:ml-0">
                  <AppHeader navItems={navItems} user={session.user} />
                  <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:pl-6">
                    <ErrorBoundary>
                      <div className="flex-1">{children}</div>
                    </ErrorBoundary>
                  </main>
                </div>
              </>
            ) : (
              <ErrorBoundary>
                <div className="flex flex-1 flex-col">{children}</div>
              </ErrorBoundary>
            )}
          </div>
        </Providers>
      </body>
    </html>
  )
}
