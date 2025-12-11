'use client'

import Link from 'next/link'
import { Search, PlusCircle, BellDot, Sparkles } from 'lucide-react'

import { UserMenu } from '@/components/navigation/UserMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AppNav, type AppNavItem } from '@/components/navigation/AppNavigation'
import { Logo } from '@/components/brand/Logo'
import { isFeatureEnabled } from '@/config/features'

export type AppHeaderProps = {
  user?: {
    name?: string | null
    email?: string | null
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
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-muted/60">
              <Logo size={38} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">OKRFlow</span>
                <span className="text-xs text-muted-foreground">Strategy → Outcomes</span>
              </div>
            </Link>
            {envLabel ? (
              <span className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                {envLabel}
              </span>
            ) : null}
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {getQuarterLabel()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Weekly check-in due</span>
            </div>
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex items-center gap-2">
              <Link href="/okrs/new">
                <PlusCircle className="h-4 w-4" aria-hidden />
                New Objective
              </Link>
            </Button>
            {isFeatureEnabled('themeToggle') && <ThemeToggle />}
            <UserMenu name={user?.name} email={user?.email} />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="relative max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
              <Input
                type="search"
                placeholder="Search objectives, key results, or people"
                className="w-full rounded-full border-border/60 bg-card pl-11 text-sm placeholder:text-muted-foreground/70 shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-muted/80 px-2 py-1 text-[11px] text-muted-foreground">
                <kbd className="rounded border border-border/70 bg-background px-1">Ctrl</kbd>
                <kbd className="rounded border border-border/70 bg-background px-1">K</kbd>
              </div>
            </div>
          </div>

          {navItems.length ? (
            <div className="flex items-center gap-3">
              <AppNav items={navItems} orientation="horizontal" className="flex-wrap gap-1" />
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <BellDot className="h-4 w-4" />
                Alerts
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
