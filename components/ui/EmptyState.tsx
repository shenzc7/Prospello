import { ReactNode } from 'react'

import { cn } from '@/lib/ui'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-dashed border-muted-foreground/25 bg-card/60 p-10 text-center shadow-soft backdrop-blur-xs',
        className
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
        {icon ? <div className="text-foreground/60">{icon}</div> : null}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p>{description}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </section>
  )
}
