'use client'

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { Sparkles, ShieldCheck, Timer } from 'lucide-react'

import { isFeatureEnabled } from '@/config/features'
import { disableDemo, enableDemo, getDemoState, nextDemoRole, previousDemoRole, setDemoState, subscribe, type DemoRole } from '@/lib/demo/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type DemoContextValue = {
  enabled: boolean
  role: DemoRole
  autoCycle: boolean
  startDemo: (role?: DemoRole) => void
  stopDemo: () => void
  setRole: (role: DemoRole) => void
  toggleAutoCycle: () => void
  nextRole: () => void
  previousRole: () => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

function useDemoStore() {
  return useSyncExternalStore(subscribe, getDemoState, getDemoState)
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const state = useDemoStore()
  const featureOn = isFeatureEnabled('demoMode')

  // Auto-cycle roles to simulate multi persona view
  useEffect(() => {
    if (!state.enabled || !state.autoCycle) return
    const id = setInterval(() => {
      nextDemoRole()
    }, 12000)
    return () => clearInterval(id)
  }, [state.enabled, state.autoCycle])

  // Persist a lightweight flag for middleware to allow admin demo access
  useEffect(() => {
    if (!featureOn) return
    if (state.enabled) {
      document.cookie = `demoMode=1; path=/; SameSite=Lax`
    } else {
      document.cookie = `demoMode=0; path=/; Max-Age=0; SameSite=Lax`
    }
  }, [state.enabled, featureOn])

  const startDemo = useCallback((role?: DemoRole) => enableDemo(role), [])
  const stopDemo = useCallback(() => disableDemo(), [])
  const setRole = useCallback((role: DemoRole) => setDemoState({ role }), [])
  const toggleAutoCycle = useCallback(() => setDemoState({ autoCycle: !state.autoCycle }), [state.autoCycle])

  const value = useMemo<DemoContextValue>(
    () => ({
      enabled: state.enabled,
      role: state.role,
      autoCycle: state.autoCycle,
      startDemo,
      stopDemo,
      setRole,
      toggleAutoCycle,
      nextRole: nextDemoRole,
      previousRole: previousDemoRole,
    }),
    [state.enabled, state.role, state.autoCycle, startDemo, stopDemo, setRole, toggleAutoCycle]
  )

  if (!featureOn) {
    return <>{children}</>
  }

  return (
    <DemoContext.Provider value={value}>
      {children}
      {state.enabled ? <DemoHud role={state.role} autoCycle={state.autoCycle} stopDemo={stopDemo} toggleAutoCycle={toggleAutoCycle} /> : null}
    </DemoContext.Provider>
  )
}

function DemoHud({ role, autoCycle, stopDemo, toggleAutoCycle }: { role: DemoRole; autoCycle: boolean; stopDemo: () => void; toggleAutoCycle: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl p-3 min-w-[240px]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-primary">Demo mode</span>
          </div>
          <Badge variant="outline" className="text-[11px]">
            {role}
          </Badge>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Read-only, seeded data. Use the toggle to exit.
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="secondary" onClick={toggleAutoCycle} className="flex items-center gap-1">
            <Timer className="h-4 w-4" aria-hidden />
            {autoCycle ? 'Auto-cycle on' : 'Auto-cycle off'}
          </Button>
          <Button size="sm" variant="ghost" onClick={stopDemo}>
            Exit
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useDemoMode() {
  const ctx = useContext(DemoContext)
  if (!ctx) {
    return {
      enabled: false,
      role: 'ADMIN' as DemoRole,
      autoCycle: false,
      startDemo: () => {},
      stopDemo: () => {},
      setRole: () => {},
      toggleAutoCycle: () => {},
      nextRole: () => {},
      previousRole: () => {},
    }
  }
  return ctx
}
