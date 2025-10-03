'use client'

import { cn } from '@/lib/ui'
import { type ObjectiveStatusValue } from '@/hooks/useObjectives'

type StatusToken = {
  label: string
  className: string
  dotClassName: string
}

const STATUS_TOKENS: Record<ObjectiveStatusValue, StatusToken> = {
  NOT_STARTED: {
    label: 'Not started',
    className: 'bg-slate-100/90 text-slate-700 ring-1 ring-slate-200/60 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-600/60',
    dotClassName: 'bg-slate-500/70',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className:
      'bg-sky-100/90 text-sky-800 ring-1 ring-sky-500/25 shadow-sm dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/40',
    dotClassName: 'bg-sky-500',
  },
  AT_RISK: {
    label: 'At risk',
    className:
      'bg-amber-100/90 text-amber-800 ring-1 ring-amber-400/25 shadow-sm dark:bg-amber-400/20 dark:text-amber-100 dark:ring-amber-400/40',
    dotClassName: 'bg-amber-500',
  },
  DONE: {
    label: 'Completed',
    className:
      'bg-emerald-100/90 text-emerald-800 ring-1 ring-emerald-400/25 shadow-sm dark:bg-emerald-400/20 dark:text-emerald-50 dark:ring-emerald-400/40',
    dotClassName: 'bg-emerald-500',
  },
}

type ObjectiveStatusBadgeProps = {
  status: ObjectiveStatusValue
  className?: string
}

export function ObjectiveStatusBadge({ status, className }: ObjectiveStatusBadgeProps) {
  const token = STATUS_TOKENS[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-soft backdrop-blur-[2px]',
        token.className,
        className
      )}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full shadow-sm', token.dotClassName)} aria-hidden />
      {token.label}
    </span>
  )
}
