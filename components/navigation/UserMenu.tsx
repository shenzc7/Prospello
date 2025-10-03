'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { strings } from '@/config/strings'
import { cn } from '@/lib/ui'

type UserMenuProps = {
  name?: string | null
  email?: string | null
}

export function UserMenu({ name, email }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) return
      if (menuRef.current.contains(event.target as Node)) return
      setOpen(false)
    }

    if (open) {
      document.addEventListener('mousedown', handleClick)
    }

    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const initials = useMemo(() => {
    if (name) {
      return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }, [name, email])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1.5 text-sm font-medium text-foreground shadow-soft transition hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-slate-900/80'
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </span>
        <span className="hidden flex-col text-left leading-tight sm:flex">
          <span className="text-xs font-semibold text-foreground">{name ?? strings.navigation.fallbackUser}</span>
          <span className="text-[11px] text-muted-foreground">{email ?? strings.navigation.signedInStatus}</span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border bg-card/95 p-4 text-sm shadow-soft backdrop-blur-xs"
        >
          <div className="mb-3 space-y-1">
            <p className="text-xs text-muted-foreground">{strings.navigation.signedInAs}</p>
            <p className="font-medium text-foreground">{name ?? email ?? strings.navigation.fallbackUser}</p>
            {name && email ? <p className="text-xs text-muted-foreground">{email}</p> : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="group w-full justify-start gap-2 rounded-full px-3 py-2 text-sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4 text-muted-foreground transition group-hover:text-destructive" aria-hidden />
            {strings.navigation.signOut}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
