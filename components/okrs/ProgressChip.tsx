'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const thresholds = [
  { min: 75, variant: 'success', label: 'On Track' },
  { min: 50, variant: 'warning', label: 'At Risk' },
  { min: 0, variant: 'danger', label: 'Off Track' },
] as const

type ProgressChipProps = {
  value: number
  className?: string
  withLabel?: boolean
  testId?: string
}

export function ProgressChip({ value, className, withLabel = false, testId }: ProgressChipProps) {
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0
  const match = thresholds.find((item) => clamped >= item.min) ?? thresholds.at(-1)!
  const content = withLabel ? `${match.label} • ${clamped}%` : `${clamped}%`

  return (
    <Badge
      data-testid={testId}
      variant={match.variant}
      className={cn('min-w-[4.5rem] justify-center', className)}
    >
      {content}
    </Badge>
  )
}
