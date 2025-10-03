'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  min?: number
  max?: number
  step?: number
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min = 0, max = 100, step = 1, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        className={cn('h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary', className)}
        {...props}
      />
    )
  }
)

Slider.displayName = 'Slider'
