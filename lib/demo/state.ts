export type DemoRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

export type DemoState = {
  enabled: boolean
  role: DemoRole
  autoCycle: boolean
  hudHidden: boolean
  startedAt?: number
}

type Listener = () => void

let state: DemoState = {
  enabled: false,
  role: 'ADMIN',
  autoCycle: false,
  hudHidden: false,
  startedAt: undefined,
}

const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDemoState(): DemoState {
  return state
}

export function setDemoState(next: Partial<DemoState>) {
  state = { ...state, ...next }
  notify()
}

export function enableDemo(role?: DemoRole) {
  setDemoState({
    enabled: true,
    role: role ?? state.role,
    startedAt: Date.now(),
  })
}

export function disableDemo() {
  setDemoState({
    enabled: false,
    autoCycle: false,
    hudHidden: false,
  })
}

export function hideDemoHud() {
  setDemoState({
    hudHidden: true,
    autoCycle: false,
  })
}

export function showDemoHud() {
  setDemoState({
    hudHidden: false,
  })
}

const roleOrder: DemoRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE']

export function nextDemoRole() {
  const index = roleOrder.indexOf(state.role)
  const nextIndex = (index + 1) % roleOrder.length
  setDemoState({ role: roleOrder[nextIndex] })
  return roleOrder[nextIndex]
}

export function previousDemoRole() {
  const index = roleOrder.indexOf(state.role)
  const nextIndex = (index - 1 + roleOrder.length) % roleOrder.length
  setDemoState({ role: roleOrder[nextIndex] })
  return roleOrder[nextIndex]
}





