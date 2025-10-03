import { test, expect } from '@playwright/test';

test.describe('OKR Creation and Progress Calculation', () => {
  test('should reflect correct weighted progress after creating an objective and setting KR percents', async ({ page }) => {
    // Assumes admin user exists and login works
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard');

    // Create a new Objective
    await page.goto('/objectives');
    await page.getByRole('button', { name: 'New Objective' }).click();
    
    const objectiveTitle = `Test Objective ${Date.now()}`;
    await page.getByLabel('Title').fill(objectiveTitle);
    await page.getByLabel('Description').fill('E2E test for weighted progress.');
    await page.getByRole('button', { name: 'Create Objective' }).click();

    // Wait for navigation and verify objective exists
    await page.waitForURL('**/objectives/**');
    await expect(page.getByRole('heading', { name: objectiveTitle })).toBeVisible();
    await expect(page.getByText('Progress: 0%')).toBeVisible();

    // Add KR 1 (60% weight)
    await page.getByRole('button', { name: 'Add Key Result' }).click();
    await page.getByLabel('Title').fill('KR 1 - 60% weight');
    await page.getByLabel('Weight').fill('60');
    await page.getByRole('button', { name: 'Add KR' }).click();
    
    // Add KR 2 (40% weight)
    await page.getByRole('button', { name: 'Add Key Result' }).click();
    await page.getByLabel('Title').fill('KR 2 - 40% weight');
    await page.getByLabel('Weight').fill('40');
    await page.getByRole('button', { name: 'Add KR' }).click();

    // Wait for KRs to appear
    await expect(page.getByText('KR 1 - 60% weight')).toBeVisible();
    await expect(page.getByText('KR 2 - 40% weight')).toBeVisible();
    await expect(page.getByText('Progress: 0%')).toBeVisible();

    // Update KR 1 progress to 50%
    // The UI for this is an assumption - e.g., a slider or input
    await page.locator('.kr-item:has-text("KR 1")').getByRole('slider').fill('50');
    // Weighted progress: 50% of 60 = 30. Total progress = 30%
    await expect(page.getByText('Progress: 30%')).toBeVisible();

    // Update KR 2 progress to 100%
    await page.locator('.kr-item:has-text("KR 2")').getByRole('slider').fill('100');
    // Weighted progress: (50% of 60) + (100% of 40) = 30 + 40 = 70. Total progress = 70%
    await expect(page.getByText('Progress: 70%')).toBeVisible();
  });
});
