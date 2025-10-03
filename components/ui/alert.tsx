'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

const base = 'relative w-full rounded-lg border px-4 py-3 text-sm'

const variants: Record<'default' | 'destructive' | 'success', string> = {
  default: 'border-border text-foreground',
  destructive: 'border-destructive/50 text-destructive',
  success: 'border-emerald-500/50 text-emerald-600'
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant = 'default', ...props }, ref) => (
  <div ref={ref} role="status" className={cn(base, variants[variant], className)} {...props} />
))

Alert.displayName = 'Alert'

export { Alert }
