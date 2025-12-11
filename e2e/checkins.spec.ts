import { test, expect } from '@playwright/test';

test.describe('Check-ins dashboard', () => {
  test('loads seeded data and cycle health', async ({ page }) => {
    const csrf = await page.request.get('/api/auth/csrf');
    const { csrfToken } = await csrf.json();
    const res = await page.request.post('/api/auth/callback/credentials', {
      form: {
        csrfToken,
        email: 'admin@techflow.dev',
        password: 'Pass@123',
        callbackUrl: '/',
      },
    });
    expect(res.ok()).toBeTruthy();
    const sessionRes = await page.request.get('/api/auth/session');
    const session = await sessionRes.json();
    expect(session?.user?.email).toBe('admin@techflow.dev');

    await page.goto('/checkins');
    await expect(page).toHaveURL(/checkins/);
    await expect(page.getByText('Cycle health')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Weekly Check-ins/i })).toBeVisible();
  });
});
