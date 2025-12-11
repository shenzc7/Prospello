import { strings } from '@/config/strings'
import { isFeatureEnabled } from '@/config/features'

export type AppNavItem = {
  href: string
  label: string
  icon: string
  exact?: boolean
}

export function buildNavItems(role?: string): AppNavItem[] {
  const base: AppNavItem[] = [
    { href: '/', label: strings.navigation.items.company, icon: 'Target' },
    { href: '/teams', label: strings.navigation.items.teams, icon: 'UserRound' },
    { href: '/my-okrs', label: strings.navigation.items.myOkrs, icon: 'ClipboardList' },
  ]

  if (role === 'ADMIN' || role === 'MANAGER') {
    base.push({ href: '/reports', label: strings.navigation.items.reports, icon: 'BarChart3' })
  }

  // Settings page for all users (PRD requirement)
  base.push({ href: '/settings', label: strings.navigation.items.settings, icon: 'Settings' })

  if (role === 'ADMIN' && isFeatureEnabled('adminExtras')) {
    base.push({ href: '/admin/users', label: 'Admin', icon: 'ShieldCheck' })
  }

  return base
}
