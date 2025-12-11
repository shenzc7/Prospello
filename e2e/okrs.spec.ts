import { test, expect } from '@playwright/test';

test.describe('OKR seed smoke', () => {
  test('seeded objectives are visible to admin', async ({ page }) => {
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

    await page.goto('/objectives');
    await expect(page).toHaveURL(/objectives/);
    await expect(page.getByText(/Increase User Adoption by 40%/i)).toBeVisible();
    await expect(page.getByText(/Improve API Performance by 50%/i)).toBeVisible();
    await expect(page.getByText(/Achieve 99.9% Deployment Uptime/i)).toBeVisible();
  });
});
