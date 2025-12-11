'use client'

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { Sparkles, ShieldCheck, Timer, Eye, EyeOff, Globe2, Users } from 'lucide-react'

import { isFeatureEnabled } from '@/config/features'
import {
  disableDemo,
  enableDemo,
  getDemoState,
  hideDemoHud,
  nextDemoRole,
  previousDemoRole,
  setDemoState,
  showDemoHud,
  subscribe,
  type DemoRole,
} from '@/lib/demo/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type DemoContextValue = {
  enabled: boolean
  role: DemoRole
  autoCycle: boolean
  hudHidden: boolean
  startDemo: (role?: DemoRole) => void
  stopDemo: () => void
  setRole: (role: DemoRole) => void
  toggleAutoCycle: () => void
  nextRole: () => void
  previousRole: () => void
  hideHud: () => void
  showHud: () => void
}

type DemoAccessContextValue = {
  featureEnabled: boolean
  userOptIn: boolean
  setUserOptIn: (value: boolean) => void
}

const DemoContext = createContext<DemoContextValue | null>(null)
const DemoAccessContext = createContext<DemoAccessContextValue | null>(null)

function useDemoStore() {
  return useSyncExternalStore(subscribe, getDemoState, getDemoState)
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const state = useDemoStore()
  const featureOn = isFeatureEnabled('demoMode')
  const [userOptIn, setUserOptIn] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('demoFeature') === '1'
    setUserOptIn(stored)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (userOptIn) {
      window.localStorage.setItem('demoFeature', '1')
    } else {
      window.localStorage.removeItem('demoFeature')
    }
  }, [userOptIn])

  const featureEnabled = featureOn || userOptIn

  // Auto-cycle roles to simulate multi persona view
  useEffect(() => {
    if (!state.enabled || !state.autoCycle || state.hudHidden) return
    const id = setInterval(() => {
      nextDemoRole()
    }, 12000)
    return () => clearInterval(id)
  }, [state.enabled, state.autoCycle, state.hudHidden])

  // Persist a lightweight flag for middleware to allow admin demo access
  useEffect(() => {
    if (!featureEnabled) return
    if (state.enabled) {
      document.cookie = `demoMode=1; path=/; SameSite=Lax`
    } else {
      document.cookie = `demoMode=0; path=/; Max-Age=0; SameSite=Lax`
    }
  }, [state.enabled, featureEnabled])

  const startDemo = useCallback((role?: DemoRole) => enableDemo(role), [])
  const stopDemo = useCallback(() => disableDemo(), [])
  const setRole = useCallback((role: DemoRole) => setDemoState({ role }), [])
  const toggleAutoCycle = useCallback(() => setDemoState({ autoCycle: !state.autoCycle }), [state.autoCycle])
  const hideHud = useCallback(() => hideDemoHud(), [])
  const showHud = useCallback(() => showDemoHud(), [])

  const value = useMemo<DemoContextValue>(
    () => ({
      enabled: state.enabled,
      role: state.role,
      autoCycle: state.autoCycle,
      hudHidden: state.hudHidden,
      startDemo,
      stopDemo,
      setRole,
      toggleAutoCycle,
      nextRole: nextDemoRole,
      previousRole: previousDemoRole,
      hideHud,
      showHud,
    }),
    [state.enabled, state.role, state.autoCycle, state.hudHidden, startDemo, stopDemo, setRole, toggleAutoCycle, hideHud, showHud]
  )

  if (!featureEnabled) {
    return (
      <DemoAccessContext.Provider value={{ featureEnabled, userOptIn, setUserOptIn }}>
        {children}
      </DemoAccessContext.Provider>
    )
  }

  return (
    <DemoAccessContext.Provider value={{ featureEnabled, userOptIn, setUserOptIn }}>
      <DemoContext.Provider value={value}>
        {children}
        {state.enabled && !state.hudHidden ? (
          <DemoHud
            role={state.role}
            autoCycle={state.autoCycle}
            stopDemo={stopDemo}
            toggleAutoCycle={toggleAutoCycle}
            setRole={setRole}
            hideHud={hideHud}
          />
        ) : null}
        {state.enabled && state.hudHidden ? <DemoHudRestore onShow={showHud} /> : null}
      </DemoContext.Provider>
    </DemoAccessContext.Provider>
  )
}

function DemoHud({
  role,
  autoCycle,
  stopDemo,
  toggleAutoCycle,
  setRole,
  hideHud,
}: {
  role: DemoRole
  autoCycle: boolean
  stopDemo: () => void
  toggleAutoCycle: () => void
  setRole: (role: DemoRole) => void
  hideHud: () => void
}) {
  const personas: Array<{ role: DemoRole; label: string; helper: string }> = [
    { role: 'ADMIN', label: 'Admin', helper: 'company + exports' },
    { role: 'MANAGER', label: 'Manager', helper: 'team pipeline' },
    { role: 'EMPLOYEE', label: 'IC', helper: 'personal updates' },
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl p-3 min-w-[280px] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-primary">Demo mode</span>
          </div>
          <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
            {role}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Read-only, seeded data spanning global teams. Auto-cycle rotates personas; pause or hide for screenshots.
        </div>
        <Separator className="my-2" />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden />
              Persona
            </span>
            <span className="text-[11px] text-primary/80">Admin → Manager → IC</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {personas.map((persona) => (
              <Button
                key={persona.role}
                size="sm"
                variant={role === persona.role ? 'secondary' : 'ghost'}
                className="flex flex-col gap-0.5 py-2"
                onClick={() => setRole(persona.role)}
              >
                <span className="text-xs font-semibold">{persona.label}</span>
                <span className="text-[10px] text-muted-foreground">{persona.helper}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2 justify-between">
          <Button size="sm" variant="secondary" onClick={toggleAutoCycle} className="flex items-center gap-1">
            <Timer className="h-4 w-4" aria-hidden />
            {autoCycle ? 'Auto-cycle on' : 'Auto-cycle off'}
          </Button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={hideHud} className="flex items-center gap-1">
              <EyeOff className="h-4 w-4" aria-hidden />
              Hide for shots
            </Button>
            <Button size="sm" variant="ghost" onClick={stopDemo}>
              Exit
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-[11px] text-primary/90">
          <div className="flex items-center gap-1">
            <Globe2 className="h-3 w-3" aria-hidden />
            <span>Simulating 100+ users, global teams, and active tasks.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoHudRestore({ onShow }: { onShow: () => void }) {
  return (
    <button
      type="button"
      onClick={onShow}
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-background/90 px-3 py-2 text-xs font-semibold text-primary shadow-lg hover:bg-primary/10"
    >
      <Eye className="h-4 w-4" aria-hidden />
      Show demo controls
    </button>
  )
}

export function useDemoMode() {
  const ctx = useContext(DemoContext)
  if (!ctx) {
    return {
      enabled: false,
      role: 'ADMIN' as DemoRole,
      autoCycle: false,
      hudHidden: false,
      startDemo: () => {},
      stopDemo: () => {},
      setRole: () => {},
      toggleAutoCycle: () => {},
      nextRole: () => {},
      previousRole: () => {},
      hideHud: () => {},
      showHud: () => {},
    }
  }
  return ctx
}

export function useDemoAccess() {
  const ctx = useContext(DemoAccessContext)
  if (!ctx) {
    return {
      featureEnabled: false,
      userOptIn: false,
      setUserOptIn: () => {},
    }
  }
  return ctx
}
