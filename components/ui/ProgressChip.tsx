import { ReactNode } from 'react'

import { cn } from '@/lib/ui'

export type ProgressTone = 'green' | 'yellow' | 'red' | 'gray'

type ToneConfig = {
  glyph: string
  className: string
  fallbackLabel: string
}

const toneMap: Record<ProgressTone, ToneConfig> = {
  green: {
    glyph: 'G',
    className: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/25',
    fallbackLabel: 'On track',
  },
  yellow: {
    glyph: 'Y',
    className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-500/25',
    fallbackLabel: 'At risk',
  },
  red: {
    glyph: 'R',
    className: 'bg-rose-100 text-rose-700 ring-1 ring-rose-500/25',
    fallbackLabel: 'Off track',
  },
  gray: {
    glyph: '–',
    className: 'bg-muted text-muted-foreground ring-1 ring-transparent',
    fallbackLabel: 'No data',
  },
}

type ProgressChipProps = {
  tone: ProgressTone
  children?: ReactNode
  className?: string
  srLabel?: string
}

export function ProgressChip({ tone, children, className, srLabel }: ProgressChipProps) {
  const config = toneMap[tone]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm backdrop-blur-[2px]',
        config.className,
        className
      )}
    >
      <span aria-hidden>{config.glyph}</span>
      {children ? children : null}
      <span className="sr-only">{srLabel ?? config.fallbackLabel}</span>
    </span>
  )
}
