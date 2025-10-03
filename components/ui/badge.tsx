'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

const variants: Record<'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'destructive', string> = {
  default: 'bg-muted text-muted-foreground',
  secondary: 'bg-secondary text-secondary-foreground border border-border/40',
  outline: 'border border-border/60 bg-background text-foreground',
  success: 'bg-muted text-foreground',
  warning: 'bg-muted text-foreground',
  danger: 'bg-muted text-foreground',
  destructive: 'bg-muted text-foreground',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
  'aria-label'?: string
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors backdrop-blur-[2px]',
        variants[variant],
        className
      )}
      {...props}
    />
  )
)

Badge.displayName = 'Badge'

export { Badge }
