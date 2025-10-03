'use client'

import { useState } from 'react'

import { QuickCheckInRow } from '@/components/check-ins/QuickCheckInRow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CheckInDrawerProps = {
  keyResultId: string
  keyResultTitle: string
  current: number
  unit?: string | null
  triggerLabel?: string
  className?: string
}

export function CheckInDrawer({
  keyResultId,
  keyResultTitle,
  current,
  unit,
  triggerLabel = 'Update',
  className,
}: CheckInDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('inline-flex', className)}>
      <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <div className="w-full max-w-lg rounded-t-xl border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Check-In</p>
                <h3 className="text-sm font-semibold">{keyResultTitle}</h3>
              </div>
              <Button className="h-8 px-3 text-xs" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <div className="px-6 py-4">
              <QuickCheckInRow
                keyResultId={keyResultId}
                current={current}
                unit={unit}
                onSuccess={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
