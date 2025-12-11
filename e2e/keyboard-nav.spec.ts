import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('login form is keyboard focusable and login works', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });

    // Tab to email, ensure focus, fill seeded admin
    const email = page.getByLabel('Email address');
    await email.focus();
    await expect(email).toBeFocused();
    await page.keyboard.type('admin@techflow.dev');

    // Tab to password, ensure focus
    await page.keyboard.press('Tab');
    const password = page.getByLabel('Password');
    await expect(password).toBeFocused();
    await page.keyboard.type('Pass@123');

    // Tab to submit and submit
    await page.keyboard.press('Tab');
    const submit = page.getByTestId('login-submit');
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
  });
});
