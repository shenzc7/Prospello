// Test file temporarily disabled - uncomment when @playwright/test is installed
// import { test, expect } from '@playwright/test';

// test.describe('OKR Creation and Progress', () => {
//   test('should allow creating an objective, adding KRs, and see progress update', async ({ page }) => {
//     // Prerequisite: User is logged in. This test assumes a logged-in state.
//     await page.goto('/login');
//     await page.getByLabel('Email').fill('me@okrflow.test');
//     await page.getByLabel('Password').fill('Pass@123');
//     await page.getByRole('button', { name: 'Login' }).click();
//     await page.waitForURL('/'); // Assuming login redirects to home

//     // 1. Create a new Objective
//     await page.goto('/objectives');
//     await page.getByRole('button', { name: 'New Objective' }).click();

//     await page.getByLabel('Title').fill('Test Objective');
//     await page.getByLabel('Description').fill('This is a test objective for E2E testing.');
//     await page.getByRole('button', { name: 'Create Objective' }).click();

//     // Should be on the new objective's detail page
//     await page.waitForSelector('text="Test Objective"');
//     await expect(page.getByText('Progress: 0%')).toBeVisible();

//     // 2. Add first Key Result
//     await page.getByRole('button', { name: 'Add Key Result' }).click();
//     await page.getByLabel('Title').fill('KR 1');
//     await page.getByLabel('Weight').fill('50');
//     await page.getByLabel('Initial Progress').fill('50');
//     await page.getByRole('button', { name: 'Add KR' }).click();

//     // Progress should be updated: 50% progress * 50% weight = 25%
//     await expect(page.getByText('Progress: 25%')).toBeVisible();

//     // 3. Add second Key Result
//     await page.getByRole('button', { name: 'Add Key Result' }).click();
//     await page.getByLabel('Title').fill('KR 2');
//     await page.getByLabel('Weight').fill('50');
//     await page.getByLabel('Initial Progress').fill('100');
//     await page.getByRole('button', { name: 'Add KR' }).click();

//     // Progress should be updated: (50% * 50%) + (100% * 50%) = 25% + 50% = 75%
//     await expect(page.getByText('Progress: 75%')).toBeVisible();
//   });
// });
