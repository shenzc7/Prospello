import { test, expect, request as playwrightRequest } from '@playwright/test'

async function login(context: playwrightRequest.APIRequestContext, email: string, password = 'Pass@123') {
  const csrf = await context.get('/api/auth/csrf')
  const { csrfToken } = await csrf.json()
  const res = await context.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: '/',
    },
  })
  expect(res.ok()).toBeTruthy()
}

test('manager assignment notifies assignee and edits are visible to admin', async ({ request }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  const managerCtx = await playwrightRequest.newContext({ baseURL })
  const employeeCtx = await playwrightRequest.newContext({ baseURL })
  const adminCtx = await playwrightRequest.newContext({ baseURL })

  // Login users
  await login(managerCtx, 'manager@techflow.dev')
  await login(employeeCtx, 'me@techflow.dev')
  await login(adminCtx, 'admin@techflow.dev')

  // Lookup employee ID
  const usersRes = await managerCtx.get('/api/users?search=me@techflow.dev')
  expect(usersRes.ok()).toBeTruthy()
  const usersData = await usersRes.json()
  const employeeList = usersData.data?.users ?? []
  const employee = employeeList.find((u: { email: string }) => u.email === 'me@techflow.dev')
  expect(employee?.id).toBeTruthy()

  // Create an objective assigned to the employee (as manager)
  const title = `Assignment flow ${Date.now()}`
  const start = new Date()
  const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30) // +30 days

  const createRes = await managerCtx.post('/api/objectives', {
    data: {
      title,
      description: 'End-to-end assignment flow',
      cycle: 'Test Cycle',
      goalType: 'COMPANY',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      ownerId: employee.id,
      keyResults: [
        { title: 'Deliver milestone', weight: 100, target: 1, current: 0, unit: 'milestone' },
      ],
    },
  })
  expect(createRes.status()).toBe(201)
  const created = await createRes.json()
  const objectiveId = created.data?.objective?.id as string
  expect(objectiveId).toBeTruthy()

  // Assignee should see a notification about the assignment
  const notificationsRes = await employeeCtx.get('/api/notifications')
  expect(notificationsRes.ok()).toBeTruthy()
  const notificationsData = await notificationsRes.json()
  const assignmentNotification = notificationsData.notifications.find((n: { message: string; metadata?: string }) => {
    let metadata: unknown = n.metadata
    if (typeof n.metadata === 'string') {
      try {
        metadata = JSON.parse(n.metadata)
      } catch (err) {
        metadata = null
      }
    }

    return n.message.includes(title) || (metadata as { objectiveId?: string } | null)?.objectiveId === objectiveId
  })
  expect(assignmentNotification).toBeTruthy()

  // Assignee edits the objective title
  const updatedTitle = `${title} (updated)`
  const updateRes = await employeeCtx.patch(`/api/objectives/${objectiveId}`, {
    data: { title: updatedTitle },
  })
  expect(updateRes.ok()).toBeTruthy()

  // Admin can read the updated objective
  const fetchRes = await adminCtx.get(`/api/objectives/${objectiveId}`)
  expect(fetchRes.ok()).toBeTruthy()
  const fetched = await fetchRes.json()
  expect(fetched.data?.objective?.title).toBe(updatedTitle)

  // Clean up test data
  await adminCtx.delete(`/api/objectives/${objectiveId}`)
})
