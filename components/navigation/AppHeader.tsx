'use client'

import Link from 'next/link'
import { Search, PlusCircle } from 'lucide-react'

import { type AppNavItem } from '@/components/navigation/AppNavigation'
import { UserMenu } from '@/components/navigation/UserMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export type AppHeaderProps = {
  user?: {
    name?: string | null
    email?: string | null
  }
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden max-w-sm flex-1 sm:flex">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full border-border/30 bg-muted/30 pl-10 text-sm placeholder:text-muted-foreground/60"
            />
          </div>
          <Button asChild size="sm" className="hidden items-center gap-2 sm:flex">
            <Link href="/okrs/new">
              <PlusCircle className="h-4 w-4" aria-hidden />
              New
            </Link>
          </Button>
          <ThemeToggle />
        </div>
        <div className="flex items-center">
          <UserMenu name={user?.name} email={user?.email} />
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-border/20 bg-muted/20 px-3 pb-4 pt-4 sm:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
          <Input
            type="search"
            placeholder="Search objectives, key results..."
            className="w-full border-border/40 bg-background/90 pl-10 text-sm placeholder:text-muted-foreground/70 shadow-sm focus:shadow-md transition-shadow"
          />
        </div>
      </div>
    </header>
  )
}
