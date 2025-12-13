'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, ShieldCheck, Target, UserRound, BarChart3, Settings, Bell, MailPlus, type LucideIcon } from 'lucide-react'
import { useEffect, useCallback, useTransition } from 'react'

import { cn } from '@/lib/ui'
import { isFeatureEnabled } from '@/config/features'

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
  Settings,
  Bell,
  MailPlus,
}

type AppNavProps = {
  items: AppNavItem[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function AppNav({ items, orientation = 'horizontal', className }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const enableShortcuts = isFeatureEnabled('keyboardShortcuts')

  // Prefetch all nav routes on mount for instant navigation
  useEffect(() => {
    items.forEach(item => {
      router.prefetch(item.href)
    })
  }, [items, router])

  const handleNavigation = useCallback((href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }, [router])

  // Keyboard shortcuts for navigation
  useEffect(() => {
    if (!enableShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = event.key.toLowerCase()
      const isCtrl = event.ctrlKey || event.metaKey

      if (!isCtrl && key >= '1' && key <= '9') {
        const index = parseInt(key) - 1
        if (items[index]) {
          event.preventDefault()
          handleNavigation(items[index].href)
        }
      }

      if (isCtrl && key === 'g') {
        event.preventDefault()
        handleNavigation('/')
      }

      if (isCtrl && key === 'n') {
        event.preventDefault()
        handleNavigation('/okrs/new')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enableShortcuts, items, handleNavigation])

  if (!items.length) return null

  return (
    <nav 
      aria-label="Primary navigation" 
      className={cn(
        orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-1',
        isPending && 'opacity-70',
        className
      )}
    >
      {items.map(({ href, label, icon: iconName, exact }) => {
        const Icon = iconMap[iconName]
        const isActive = exact ? pathname === href : pathname?.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            onClick={(e) => {
              e.preventDefault()
              handleNavigation(href)
            }}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-full text-sm font-medium transition-all duration-150',
              'px-3 py-1.5 h-8',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export { AppNav as AppNavigation }
