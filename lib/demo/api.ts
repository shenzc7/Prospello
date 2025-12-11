import { demoCheckInSummary, demoComments, demoInitiatives, demoNotificationSettings, demoNotifications, demoObjectives, demoTeams, demoUsers } from '@/lib/demo/data'
import { disableDemo, getDemoState, nextDemoRole } from '@/lib/demo/state'

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/')
}

function readOnlyGuard(method: string) {
  if (method !== 'GET') {
    throw new Error('Demo mode is read-only. Toggle demo off to make changes.')
  }
}

export function maybeHandleDemoRequest<T>(url: string, init?: RequestInit): T | null {
  const state = getDemoState()
  if (!state.enabled) return null

  const method = (init?.method || 'GET').toUpperCase()
  const parsed = new URL(url, 'http://demo.local')
  const { pathname, searchParams } = parsed

  if (!isApiPath(pathname)) return null

  switch (pathname) {
    case '/api/objectives': {
      readOnlyGuard(method)
      const limit = Number(searchParams.get('limit') ?? demoObjectives.length)
      const offset = Number(searchParams.get('offset') ?? 0)
      const slice = demoObjectives.slice(offset, offset + limit)
      return {
        objectives: slice,
        pagination: {
          total: demoObjectives.length,
          limit,
          offset,
          hasMore: offset + limit < demoObjectives.length,
        },
      } as T
    }
    default:
      break
  }

  if (pathname.startsWith('/api/objectives/')) {
    readOnlyGuard(method)
    const id = pathname.split('/').pop() as string
    const objective = demoObjectives.find((obj) => obj.id === id)
    if (!objective) {
      throw new Error('Demo objective not found')
    }
    return { objective } as T
  }

  if (pathname === '/api/check-ins/summary') {
    readOnlyGuard(method)
    return demoCheckInSummary as T
  }

  if (pathname.startsWith('/api/comments')) {
    readOnlyGuard(method)
    const objectiveId = searchParams.get('objectiveId')
    const keyResultId = searchParams.get('keyResultId')
    const filtered = demoComments.filter((comment) => {
      if (objectiveId && comment.objectiveId !== objectiveId) return false
      if (keyResultId && comment.keyResultId !== keyResultId) return false
      return true
    })
    return { comments: filtered } as T
  }

  if (pathname === '/api/users') {
    readOnlyGuard(method)
    const search = searchParams.get('search')
    const filtered = search
      ? demoUsers.filter((user) => user.email.includes(search) || user.name?.toLowerCase().includes(search.toLowerCase()))
      : demoUsers
    return { users: filtered } as T
  }

  if (pathname === '/api/teams') {
    readOnlyGuard(method)
    return { teams: demoTeams } as T
  }

  if (pathname.startsWith('/api/teams/')) {
    readOnlyGuard(method)
    const id = pathname.split('/').pop()
    const team = demoTeams.find((t) => t.id === id)
    if (!team) throw new Error('Demo team not found')
    const objectives = demoObjectives.filter((o) => o.team?.id === team.id).map((o) => ({
      id: o.id,
      title: o.title,
      status: o.status,
      progress: o.progress,
    }))
    return { team: { ...team, objectives } } as T
  }

  if (pathname === '/api/settings/notifications') {
    if (method === 'GET') {
      return { settings: demoNotificationSettings } as T
    }
    readOnlyGuard(method)
  }

  if (pathname.startsWith('/api/settings/')) {
    readOnlyGuard(method)
    return { ok: true } as T
  }

  if (pathname.startsWith('/api/key-results/') && pathname.endsWith('/initiatives')) {
    readOnlyGuard(method)
    const parts = pathname.split('/')
    const keyResultId = parts[parts.length - 2]
    const initiatives = demoInitiatives.filter((i) => i.keyResultId === keyResultId)
    return { initiatives } as T
  }

  if (pathname.startsWith('/api/initiatives/')) {
    readOnlyGuard(method)
    return { ok: true } as T
  }

  if (pathname === '/api/notifications') {
    if (method === 'GET') {
      const userId = searchParams.get('userId')
      const notifications = userId ? demoNotifications.filter((n) => n.userId === userId) : demoNotifications
      return { notifications, unread: notifications.filter((n) => !n.read).length } as T
    }
    // Marking as read is a no-op but we keep UX smooth
    return { ok: true } as T
  }

  if (pathname === '/api/check-ins') {
    readOnlyGuard(method)
    return { ok: true } as T
  }

  if (pathname === '/api/export') {
    readOnlyGuard(method)
    throw new Error('Demo mode does not export files. Disable demo to export.')
  }

  if (pathname.startsWith('/api/admin/users')) {
    readOnlyGuard(method)
    if (method === 'GET') {
      const search = searchParams.get('search')?.toLowerCase()
      const filtered = search
        ? demoUsers.filter((user) => user.email.toLowerCase().includes(search) || (user.name ?? '').toLowerCase().includes(search))
        : demoUsers
      return {
        users: filtered.map((u) => ({
          ...u,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teams: demoTeams.map((t) => ({ id: t.id, name: t.name })),
        })),
      } as T
    }
    // PATCH/POST are no-ops in demo
    return { ok: true } as T
  }

  if (pathname.startsWith('/api/cron/scoring')) {
    readOnlyGuard(method)
    return { message: 'Demo mode: scoring simulated for showcase.' } as T
  }

  if (pathname === '/api/demo/exit') {
    disableDemo()
    return { ok: true } as T
  }

  if (pathname === '/api/demo/next-role') {
    const role = nextDemoRole()
    return { role } as T
  }

  // Unknown API path - keep normal flow
  return null
}
