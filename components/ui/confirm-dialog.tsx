'use client'

import { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/ui'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  confirmingLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmingLabel = 'Working…',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isConfirming) {
          onCancel()
        }
      }}
    >
      <div className={cn('w-full max-w-sm rounded-2xl border border-border/60 bg-card/95 p-6 shadow-soft backdrop-blur-xs', className)}>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-full border-destructive text-destructive hover:bg-destructive/10"
          >
            {isConfirming ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
