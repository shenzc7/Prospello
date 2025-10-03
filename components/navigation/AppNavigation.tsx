'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, ShieldCheck, Target, UserRound, BarChart3, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'

import { cn } from '@/lib/ui'

export type AppNavItem = {
  href: string
  label: string
  icon: string
  exact?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  Target,
  ClipboardList,
  UserRound,
  ShieldCheck,
  BarChart3,
}

type AppNavProps = {
  items: AppNavItem[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function AppNav({ items, orientation = 'horizontal', className }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = event.key.toLowerCase()
      const isCtrl = event.ctrlKey || event.metaKey

      // Number keys for navigation (1-9)
      if (!isCtrl && key >= '1' && key <= '9') {
        const index = parseInt(key) - 1
        if (items[index]) {
          event.preventDefault()
          router.push(items[index].href)
        }
      }

      // Ctrl+G for dashboard/home
      if (isCtrl && key === 'g') {
        event.preventDefault()
        router.push('/')
      }

      // Ctrl+N for new objective
      if (isCtrl && key === 'n') {
        event.preventDefault()
        router.push('/okrs/new')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items, router])

  if (!items.length) {
    return null
  }

  const containerClasses =
    orientation === 'vertical'
      ? 'flex flex-col gap-1'
      : 'flex items-center gap-1'

  return (
    <nav aria-label="Primary navigation" className={cn(containerClasses, className)}>
      {items.map(({ href, label, icon: iconName, exact }, index) => {
        const Icon = iconMap[iconName]
        const isActive = exact ? pathname === href : pathname?.startsWith(href)
        const shortcut = index < 9 ? `${index + 1}` : null

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`${label}${shortcut ? ` (keyboard shortcut: ${shortcut})` : ''}`}
            className={cn(
              'group flex items-center gap-3 rounded-md text-sm font-normal text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:text-foreground hover:bg-muted/30',
              orientation === 'vertical' ? 'px-3 py-2 min-h-[40px]' : 'px-2.5 py-2 min-h-[36px]',
              isActive && 'bg-muted/50 text-foreground font-medium'
            )}
            title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors',
                isActive && 'text-foreground'
              )}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">{label}</span>
            {shortcut && (
              <span
                className="ml-auto text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Keyboard shortcut: ${shortcut}`}
              >
                {shortcut}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export { AppNav as AppNavigation }
