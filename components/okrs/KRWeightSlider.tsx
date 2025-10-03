'use client'

import { ChangeEvent } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

type KRWeightSliderProps = {
  index: number
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  className?: string
}

export function KRWeightSlider({ index, value, onChange, onBlur, className }: KRWeightSliderProps) {
  const handleSlider = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value)
    if (!Number.isNaN(next)) {
      onChange(next)
    }
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value)
    onChange(Number.isNaN(next) ? 0 : Math.min(100, Math.max(0, Math.round(next))))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={`kr-weight-${index}`}>Weight</Label>
      <div className="flex items-center gap-3">
        <Slider
          id={`kr-weight-${index}`}
          data-testid={`kr-weight-${index}`}
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={handleSlider}
          onBlur={onBlur}
        />
        <Input
          aria-label="Weight percentage"
          className="w-20"
          value={value}
          onChange={handleInput}
          onBlur={onBlur}
          type="number"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    </div>
  )
}
