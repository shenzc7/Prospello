import { cn } from '@/lib/ui'

type SkeletonRowProps = {
  lines?: number
  className?: string
}

export function SkeletonRow({ lines = 3, className }: SkeletonRowProps) {
  return (
    <div className={cn('animate-pulse space-y-2 rounded-2xl border border-transparent bg-muted/40 p-4', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-2 rounded-full bg-muted-foreground/30',
            index === 0 && 'w-3/4',
            index === lines - 1 && 'w-5/6'
          )}
        />
      ))}
    </div>
  )
}
