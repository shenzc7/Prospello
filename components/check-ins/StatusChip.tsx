'use client'

import { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type Props = HTMLAttributes<HTMLSpanElement> & { status: 'GREEN' | 'YELLOW' | 'RED' }

export function StatusChip({ status, className, ...props }: Props) {
  const label = status === 'GREEN' ? 'On Track' : status === 'YELLOW' ? 'At Risk' : 'Off Track'
  const classes = cn(
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
    status === 'GREEN' && 'bg-emerald-100 text-emerald-800',
    status === 'YELLOW' && 'bg-amber-100 text-amber-800',
    status === 'RED' && 'bg-rose-100 text-rose-800',
    className
  )
  return (
    <span className={classes} {...props}>
      {label}
    </span>
  )
}
