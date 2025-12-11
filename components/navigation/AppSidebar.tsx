'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import { AppNav, AppNavItem } from '@/components/navigation/AppNavigation'
import { Button } from '@/components/ui/button'

type AppSidebarProps = {
  items: AppNavItem[]
  envLabel?: string
}

const fallbackLinks: AppNavItem[] = [
  { href: '/okrs', label: 'Objectives', icon: 'Target', exact: true },
  { href: '/my', label: 'My updates', icon: 'ClipboardList' },
]

export function AppSidebar({ items, envLabel }: AppSidebarProps) {
  const workingItems = items.length ? items : fallbackLinks
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isMobileOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop sidebar */}
      <aside
        className="hidden h-full w-56 flex-col border-r border-border/20 bg-background/50 px-4 pb-6 pt-4 lg:flex"
        role="complementary"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/okrs"
            className="text-sm font-medium text-foreground hover:text-muted-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label="OKR Builder home"
          >
            OKR Builder
          </Link>
          {envLabel && (
            <span className="text-xs text-muted-foreground/60" aria-label={`Environment: ${envLabel}`}>
              {envLabel}
            </span>
          )}
        </div>

        <nav className="mt-8 flex-1" role="navigation" aria-label="Primary navigation">
          <AppNav items={workingItems} orientation="vertical" />
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            className="fixed left-0 top-0 h-full w-72 flex-col border-r border-border/20 bg-background/95 backdrop-blur-md px-5 pb-6 pt-20 shadow-xl"
            role="complementary"
            aria-label="Mobile navigation"
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>

            <nav className="mt-4 flex-1" role="navigation" aria-label="Primary navigation">
              <AppNav items={workingItems} orientation="vertical" />
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
