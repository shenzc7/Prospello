import { ReactNode } from 'react'
import { cn } from '@/lib/ui'

export function FiltersBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky top-24 z-10 rounded-2xl border border-border/40 bg-background/80 p-4 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}
