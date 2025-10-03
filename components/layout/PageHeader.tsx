import { ReactNode } from 'react'
import { cn } from '@/lib/ui'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-white/90 to-emerald-50/60 px-6 py-6 shadow-xl backdrop-blur-xl dark:from-slate-900/70 dark:via-slate-950/80 dark:to-slate-900/60',
        className
      )}
    >
      <div>
        <h1 className="text-lg font-semibold text-foreground md:text-2xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
