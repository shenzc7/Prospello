// Test file temporarily disabled - uncomment when @playwright/test is installed
// import { test, expect } from '@playwright/test';

// test.describe('Admin Dashboard', () => {
//   test('should allow admin to login and see seeded users', async ({ page }) => {
//     // Navigate to the login page
//     await page.goto('/login');

//     // Fill in the login form
//     await page.getByLabel('Email').fill('admin@okrflow.test');
//     await page.getByLabel('Password').fill('Pass@123');
//     await page.getByRole('button', { name: 'Login' }).click();

//     // Wait for navigation to the admin page and check the URL
//     await page.waitForURL('/admin/users');
//     expect(page.url()).toContain('/admin/users');

//     // Check if the 3 seeded users are visible
//     const users = await page.getByRole('listitem').all();
//     expect(users.length).toBe(3);

//     // More specific checks for user content
//     await expect(page.getByText('Admin User')).toBeVisible();
//     await expect(page.getByText('admin@okrflow.test')).toBeVisible();

//     await expect(page.getByText('Manager User')).toBeVisible();
//     await expect(page.getByText('manager@okrflow.test')).toBeVisible();

//     await expect(page.getByText('Employee User')).toBeVisible();
//     await expect(page.getByText('me@okrflow.test')).toBeVisible();
//   });
// });
