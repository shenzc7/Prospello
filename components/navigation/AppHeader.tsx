'use client'

import Link from 'next/link'
import { Search, PlusCircle } from 'lucide-react'

import { AppNav, type AppNavItem } from '@/components/navigation/AppNavigation'
import { UserMenu } from '@/components/navigation/UserMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export type AppHeaderProps = {
  navItems: AppNavItem[]
  user?: {
    name?: string | null
    email?: string | null
  }
}

export function AppHeader({ navItems, user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/30 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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
      <div className="border-t border-border/20 px-4 pb-3 pt-3 sm:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full border-border/30 bg-muted/30 pl-10 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
    </header>
  )
}
