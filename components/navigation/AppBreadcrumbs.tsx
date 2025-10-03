'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Keyboard } from 'lucide-react'

import { strings } from '@/config/strings'
import { cn } from '@/lib/ui'

const breadcrumbLabels: Record<string, string> = {
  okrs: strings.breadcrumbs.okrs,
  'my-okrs': strings.breadcrumbs.myOkrs,
  my: strings.breadcrumbs.myWorkspace,
  admin: strings.breadcrumbs.admin,
  new: strings.breadcrumbs.new,
}

function formatSegment(segment: string) {
  if (!segment) return ''
  if (breadcrumbLabels[segment]) return breadcrumbLabels[segment]
  if (/^[0-9a-f-]{10,}$/i.test(segment)) return strings.breadcrumbs.details
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AppBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()

  if (pathname === '/') {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)
  if (!segments.length) {
    return null
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    return { href, label: formatSegment(segment), isCurrent: index === segments.length - 1 }
  })

  const shortcuts = [
    { key: 'Ctrl+G', description: 'Go to Dashboard' },
    { key: 'Ctrl+N', description: 'New Objective' },
    { key: 'Ctrl+F', description: 'Focus Search' },
    { key: '1-9', description: 'Navigate to section' },
  ]

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-2">
            {index > 0 ? <ChevronRight className="h-3 w-3" aria-hidden /> : null}
            {crumb.isCurrent ? (
              <span aria-current="page" className="font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="transition hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Keyboard shortcuts hint */}
      <div className="hidden items-center gap-2 text-xs text-muted-foreground/60 lg:flex">
        <Keyboard className="h-3 w-3" />
        <span>Shortcuts:</span>
        {shortcuts.map((shortcut, index) => (
          <span key={shortcut.key} className="flex items-center gap-1">
            {index > 0 && <span className="text-muted-foreground/40">•</span>}
            <kbd className="rounded border border-border/40 bg-muted/50 px-1 py-0.5 text-[10px] font-mono">
              {shortcut.key}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  )
}
