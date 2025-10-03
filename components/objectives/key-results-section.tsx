'use client'

import { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { KeyResultFields } from '@/components/objectives/key-result-fields'

type KeyResultsSectionProps = {
  fields: Array<{ id: string }>
  canAddMore: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  totalWeight: number
  footer?: ReactNode
  error?: string
}

export function KeyResultsSection({ fields, canAddMore, onAdd, onRemove, totalWeight, footer, error }: KeyResultsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Key Results</h2>
        <span className={totalWeight === 100 ? 'text-sm text-muted-foreground' : 'text-sm text-red-600'}>
          Total weight: {totalWeight}%
        </span>
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <div className="space-y-4">
        {fields.map((field, idx) => (
          <KeyResultFields key={field.id} index={idx} canRemove={fields.length > 1} onRemove={() => onRemove(idx)} />
        ))}
      </div>

      <Button type="button" variant="outline" onClick={onAdd} disabled={!canAddMore}>
        Add Key Result
      </Button>

      {footer}
    </div>
  )
}
