import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsAdmin(page: typeof test extends never ? never : any) {
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
}

test.describe('Accessibility', () => {
  test('should not have any automatically detectable accessibility issues on the login page', async ({ page }) => {
    await page.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues on the objectives page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/objectives');
    await expect(page).toHaveURL(/objectives/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('primary objective actions are focusable', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/objectives');
    await expect(page).toHaveURL(/objectives/);
    const newObjectiveLink = page.getByRole('link', { name: /New Objective/i }).first();
    await expect(newObjectiveLink).toBeVisible({ timeout: 20000 });
    await newObjectiveLink.focus();
    await expect(newObjectiveLink).toBeFocused();
  });
});
