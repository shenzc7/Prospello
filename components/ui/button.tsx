'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

const sizeVariants: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  default: 'h-10 px-5 text-sm',
  lg: 'h-12 px-8 text-base',
}

const baseStyles =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors transition-transform duration-200 ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-soft active:shadow-none active:translate-y-px'

const variants: Record<string, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline:
    'border border-border/70 bg-background/80 hover:bg-background text-foreground backdrop-blur-xs',
  ghost: 'hover:bg-foreground/5 text-foreground'
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizeVariants
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(baseStyles, sizeVariants[size], variants[variant], className)} {...props} />
  }
)

Button.displayName = 'Button'

export { Button }
