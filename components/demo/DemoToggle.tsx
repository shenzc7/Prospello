'use client'

import { Sparkles, PlayCircle, PauseCircle, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useDemoMode } from '@/components/demo/DemoProvider'
import { Badge } from '@/components/ui/badge'

type DemoToggleProps = {
  compact?: boolean
  showRole?: boolean
}

export function DemoToggle({ compact, showRole = true }: DemoToggleProps) {
  const { enabled, role, startDemo, stopDemo, nextRole } = useDemoMode()

  return (
    <div className="flex items-center gap-2">
      {showRole && enabled ? (
        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
          {role}
        </Badge>
      ) : null}
      <Button
        size={compact ? 'sm' : 'default'}
        variant={enabled ? 'secondary' : 'default'}
        onClick={() => (enabled ? stopDemo() : startDemo())}
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
