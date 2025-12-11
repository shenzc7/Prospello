'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, PlusCircle, BellDot, Sparkles } from 'lucide-react'

import { UserMenu } from '@/components/navigation/UserMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppNav, type AppNavItem } from '@/components/navigation/AppNavigation'
import { Logo } from '@/components/brand/Logo'
import { isFeatureEnabled } from '@/config/features'
import { DemoToggle } from '@/components/demo/DemoToggle'
import { useDemoMode } from '@/components/demo/DemoProvider'

export type AppHeaderProps = {
  user?: {
    name?: string | null
    email?: string | null
    role?: string | null
  }
  navItems?: AppNavItem[]
  envLabel?: string
}

function getQuarterLabel() {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return `Q${quarter} ${now.getFullYear()}`
}

export function AppHeader({ user, navItems = [], envLabel }: AppHeaderProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { enabled: demoEnabled, role } = useDemoMode()
  const showAlerts = isFeatureEnabled('notificationFeed')

  const submitSearch = () => {
    const term = query.trim()
    if (term) {
      router.push(`/okrs?search=${encodeURIComponent(term)}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-xl">
      {/* Top Bar */}
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        {/* Left: Logo + Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg transition hover:opacity-80">
            <Logo size={36} />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-semibold leading-tight">OKRFlow</span>
              <span className="text-[11px] text-muted-foreground">Strategy → Outcomes</span>
            </div>
          </Link>
          {envLabel ? (
            <span className="rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {envLabel}
            </span>
          ) : null}
          {demoEnabled ? (
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Demo • {role}
            </span>
          ) : (
            <span className="hidden sm:inline-flex rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {getQuarterLabel()}
            </span>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
            <Input
              type="search"
              placeholder="Search objectives, key results, or people"
              className="w-full h-9 rounded-full border-border/60 bg-card pl-9 pr-16 text-sm placeholder:text-muted-foreground/60 shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitSearch()
                }
              }}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[10px] text-muted-foreground">
              <kbd className="rounded border border-border/60 bg-muted px-1.5 py-0.5">Ctrl</kbd>
              <kbd className="rounded border border-border/60 bg-muted px-1.5 py-0.5">K</kbd>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex h-8 items-center gap-1.5 text-xs">
            <Link href="/okrs/new">
              <PlusCircle className="h-3.5 w-3.5" aria-hidden />
              New Objective
            </Link>
          </Button>
          {isFeatureEnabled('demoMode') ? <DemoToggle compact showRole={false} userRole={user?.role as any} /> : null}
          <UserMenu name={user?.name} email={user?.email} />
        </div>
      </div>

      {/* Navigation Bar */}
      {navItems.length ? (
        <div className="mx-auto w-full max-w-screen-xl border-t border-border/30 px-4 sm:px-6">
          <div className="flex items-center justify-between py-1.5">
            <AppNav items={navItems} orientation="horizontal" className="gap-0.5" />
            {showAlerts ? (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Link href="/alerts">
                  <BellDot className="h-3.5 w-3.5" />
                  Alerts
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  )
}
