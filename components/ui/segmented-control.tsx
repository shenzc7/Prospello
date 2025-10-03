'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/ui'

type Item = { label: string; href: string; exact?: boolean }

export function SegmentedControl({ items, className }: { items: Item[]; className?: string }) {
  const pathname = usePathname()
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border/70 bg-background/70 p-1 backdrop-blur-xs shadow-soft',
        className
      )}
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              active ? 'bg-card/90 text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )}
