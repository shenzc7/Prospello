import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('should be able to create an objective using only the keyboard', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.keyboard.press('Tab'); // Focus email
    await page.keyboard.type('user@example.com');
    await page.keyboard.press('Tab'); // Focus password
    await page.keyboard.type('password');
    await page.keyboard.press('Tab'); // Focus login button
    await page.keyboard.press('Enter');
    await page.waitForURL('/dashboard');

    // Navigate and create objective
    await page.goto('/objectives');
    await page.getByRole('button', { name: 'New Objective' }).focus();
    await page.keyboard.press('Enter');

    // In the creation modal/form
    const objectiveTitle = `Keyboard Objective ${Date.now()}`;
    await page.keyboard.press('Tab'); // Focus title input
    await page.keyboard.type(objectiveTitle);
    await page.keyboard.press('Tab'); // Focus description input
    await page.keyboard.type('Created with keyboard only.');
    await page.keyboard.press('Tab'); // Focus create button
    await page.keyboard.press('Enter');

    // Verify creation
    await page.waitForURL('**/objectives/**');
    await expect(page.getByRole('heading', { name: objectiveTitle })).toBeVisible();
  });
});
