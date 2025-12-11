'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sparkles, PlayCircle, PauseCircle, RefreshCcw, UserCog } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useDemoMode } from '@/components/demo/DemoProvider'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DemoRole } from '@/lib/demo/state'

type DemoToggleProps = {
  compact?: boolean
  showRole?: boolean
  userRole?: DemoRole
}

export function DemoToggle({ compact, showRole = true, userRole }: DemoToggleProps) {
  const { data: session } = useSession()
  const { enabled, role, startDemo, stopDemo, nextRole, setRole, hudHidden, showHud } = useDemoMode()
  const sessionRole = useMemo(() => (session?.user?.role as DemoRole | undefined) ?? userRole, [session?.user?.role, userRole])
  const [selectedRole, setSelectedRole] = useState<DemoRole>(sessionRole ?? role)

  useEffect(() => {
    setSelectedRole(sessionRole ?? role)
  }, [role, sessionRole])

  const handleStart = () => {
    const persona = selectedRole ?? sessionRole ?? role
    startDemo(persona)
    setRole(persona)
  }

  return (
    <div className="flex items-center gap-2">
      {showRole && enabled ? (
        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
          {role}
        </Badge>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={compact ? 'icon' : 'sm'} variant="ghost" className="inline-flex items-center gap-1">
            <UserCog className="h-4 w-4" aria-hidden />
            {!compact && <span className="text-xs">{selectedRole}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Start as persona</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as DemoRole[]).map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => {
                setSelectedRole(option)
                if (enabled) setRole(option)
              }}
              className="flex items-center gap-2"
            >
              <Badge variant={selectedRole === option ? 'secondary' : 'outline'} className="uppercase text-[10px]">
                {option}
              </Badge>
              {option === sessionRole ? <span className="text-[11px] text-primary">(matches my role)</span> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={showHud} disabled={!enabled || !hudHidden} className="text-xs">
            Show demo controls
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        size={compact ? 'sm' : 'default'}
        variant={enabled ? 'secondary' : 'default'}
        onClick={() => (enabled ? stopDemo() : handleStart())}
        className="inline-flex items-center gap-2"
      >
        {enabled ? <PauseCircle className="h-4 w-4" aria-hidden /> : <PlayCircle className="h-4 w-4" aria-hidden />}
        {enabled ? 'Stop demo' : 'Start demo'}
      </Button>
      <Button
        size={compact ? 'icon' : 'sm'}
        variant="ghost"
        disabled={!enabled}
        onClick={nextRole}
        aria-label="Cycle demo role"
      >
        <RefreshCcw className="h-4 w-4" aria-hidden />
      </Button>
      {!compact && (
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" aria-hidden />
          Demo data across Admin → Manager → Employee
        </div>
      )}
    </div>
  )
}
