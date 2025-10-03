import { test, expect } from '@playwright/test';

test.describe('KR Check-ins', () => {
  test('should allow a user to check in progress on a KR and see it in the history', async ({ page }) => {
    // Assumes a regular user 'user@example.com' exists and has an objective with KRs.
    // Seeding this data would be necessary for a reliable test.
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard');

    // Navigate to the user's personal page
    await page.goto('/my');
    
    // Find a KR to update. This is highly dependent on the UI.
    // We'll assume there's a list of KRs assigned to the user.
    const krToCheckIn = page.locator('.my-kr-list-item').first();
    await expect(krToCheckIn).toBeVisible();

    // Click a button to open the check-in modal
    await krToCheckIn.getByRole('button', { name: 'Check-in' }).click();

    // In the check-in modal
    await page.getByLabel('New Progress (%)').fill('65');
    await page.getByLabel('Status').click(); // Assuming it's a select/dropdown
    await page.getByRole('option', { name: 'On Track' }).click();
    await page.getByLabel('Add a comment').fill('Made good progress this week.');
    await page.getByRole('button', { name: 'Submit Check-in' }).click();

    // Assertions
    // 1. The KR's progress and status chip are updated in the list
    await expect(krToCheckIn.getByText('65%')).toBeVisible();
    const statusChip = krToCheckIn.locator('.status-chip');
    await expect(statusChip).toHaveText('On Track');
    await expect(statusChip).toHaveClass(/bg-green-200/); // Assuming class indicates color

    // 2. The new check-in appears in the history/activity feed for that KR
    await krToCheckIn.getByRole('button', { name: 'View History' }).click();
    
    const historyFeed = page.locator('.kr-history-feed');
    const today = new Date().toLocaleDateString(); // e.g., "10/1/2025"

    const latestCheckin = historyFeed.locator('.checkin-entry').first();
    await expect(latestCheckin).toContainText(`Check-in by You on ${today}`);
    await expect(latestCheckin).toContainText('Progress: 65%');
    await expect(latestCheckin).toContainText('Status: On Track');
    await expect(latestCheckin).toContainText('Made good progress this week.');
  });
});
