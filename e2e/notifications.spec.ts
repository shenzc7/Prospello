import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const PASSWORD = 'Pass@123'

async function login(email: string, password = PASSWORD) {
  const ctx = await playwrightRequest.newContext({ baseURL })
  const csrf = await ctx.get('/api/auth/csrf')
  const { csrfToken } = await csrf.json()
  const res = await ctx.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password, callbackUrl: '/' },
  })
  expect(res.ok()).toBeTruthy()
  return ctx
}

async function userByEmail(ctx: APIRequestContext, email: string) {
  const res = await ctx.get(`/api/users?search=${encodeURIComponent(email)}`)
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  return data.data?.users?.find((u: { email: string }) => u.email === email)
}

async function createObjective(ctx: APIRequestContext, input: {
  title: string
  ownerId: string
  startAt: string
  endAt: string
  goalType?: string
}) {
  const res = await ctx.post('/api/objectives', {
    data: {
      title: input.title,
      description: 'Notification flow coverage',
      cycle: 'Test Cycle',
      goalType: input.goalType ?? 'COMPANY',
      startAt: input.startAt,
      endAt: input.endAt,
      ownerId: input.ownerId,
      keyResults: [
        { title: 'KR A', weight: 100, target: 1, current: 0, unit: 'unit' },
      ],
    },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  return {
    id: body.data?.objective?.id as string,
    keyResultId: body.data?.objective?.keyResults?.[0]?.id as string,
  }
}

test.describe('Notification flows', () => {
  test('employee cannot assign objectives to others', async () => {
    const employeeCtx = await login('me@techflow.dev')
    const start = new Date()
    const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * 7)

    const res = await employeeCtx.post('/api/objectives', {
      data: {
        title: 'Unauthorized assign',
        description: 'Should fail',
        cycle: 'Test Cycle',
        goalType: 'COMPANY',
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        ownerId: 'some-other-user',
        keyResults: [{ title: 'KR', weight: 100, target: 1, current: 0 }],
      },
    })
    expect(res.status()).toBe(403)
  })

  test('comments trigger owner notifications', async () => {
    const adminCtx = await login('admin@techflow.dev')
    const managerCtx = await login('manager@techflow.dev')
    const employeeCtx = await login('me@techflow.dev')

    const admin = await userByEmail(adminCtx, 'admin@techflow.dev')
    expect(admin?.id).toBeTruthy()

    const start = new Date()
    const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * 14)
    const title = `Comment notify ${Date.now()}`
    const objective = await createObjective(managerCtx, {
      title,
      ownerId: admin.id,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    })

    const commentRes = await employeeCtx.post('/api/comments', {
      data: { content: 'Ping owner', objectiveId: objective.id },
    })
    expect(commentRes.ok()).toBeTruthy()

    const notificationsRes = await adminCtx.get('/api/notifications')
    expect(notificationsRes.ok()).toBeTruthy()
    const notifications = await notificationsRes.json()
    const found = notifications.notifications?.some((n: { message: string }) =>
      n.message.includes(title) || n.message.includes('commented')
    )
    expect(found).toBeTruthy()

    await adminCtx.delete(`/api/objectives/${objective.id}`)
  })

  test('check-ins trigger owner notifications', async () => {
    const adminCtx = await login('admin@techflow.dev')
    const managerCtx = await login('manager@techflow.dev')
    const employeeCtx = await login('me@techflow.dev')

    const employee = await userByEmail(managerCtx, 'me@techflow.dev')
    expect(employee?.id).toBeTruthy()

    const start = new Date()
    const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30)
    const title = `Check-in notify ${Date.now()}`
    const objective = await createObjective(managerCtx, {
      title,
      ownerId: employee.id,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    })

    const checkInRes = await managerCtx.post('/api/check-ins', {
      data: {
        keyResultId: objective.keyResultId,
        value: 80,
        status: 'GREEN',
        comment: 'Progressed',
      },
    })
    expect(checkInRes.ok()).toBeTruthy()

    const notificationsRes = await employeeCtx.get('/api/notifications')
    expect(notificationsRes.ok()).toBeTruthy()
    const notifications = await notificationsRes.json()
    const found = notifications.notifications?.some((n: { message: string }) =>
      n.message.includes('updated key result')
    )
    expect(found).toBeTruthy()

    await adminCtx.delete(`/api/objectives/${objective.id}`)
  })
})
