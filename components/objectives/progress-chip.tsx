'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ProgressChip({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value)
  let variant: 'default' | 'success' | 'warning' | 'danger' = 'default'

  if (rounded >= 75) {
    variant = 'success'
  } else if (rounded >= 50) {
    variant = 'warning'
  } else {
    variant = 'danger'
  }

  return <Badge variant={variant} className={cn(className)}>{rounded}%</Badge>
}
