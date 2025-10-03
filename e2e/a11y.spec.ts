import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should not have any automatically detectable accessibility issues on the login page', async ({ page }) => {
    await page.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues on the objectives page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard');

    await page.goto('/objectives');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all buttons should have an accessible name', async ({ page }) => {
    await page.goto('/objectives'); // Assuming user is logged in from previous test
    const buttons = page.getByRole('button');
    for (const button of await buttons.all()) {
      await expect(button).toHaveAccessibleName();
    }
  });

  test('all form inputs should be focusable and have an accessible name', async ({ page }) => {
     await page.goto('/objectives');
     await page.getByRole('button', { name: 'New Objective' }).click();
     
     const inputs = page.getByRole('textbox'); // or other roles like 'spinbutton'
     for (const input of await inputs.all()) {
        await input.focus();
        await expect(input).toBeFocused();
        await expect(input).toHaveAccessibleName();
     }
  });
});
