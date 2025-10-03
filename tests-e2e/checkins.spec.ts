// Test file temporarily disabled - uncomment when @playwright/test is installed
// import { test, expect } from '@playwright/test'

// test.describe('Weekly Check-ins', () => {
//   test('quick update creates weekly entry and history chip matches status', async ({ page }) => {
//     // Login
//     await page.goto('/login')
//     await page.getByTestId('login-email').fill('me@okrflow.test')
//     await page.getByTestId('login-password').fill('Pass@123')
//     await page.getByTestId('login-submit').click()
//     await page.waitForURL('**/dashboard', { waitUntil: 'load' })

//     // Navigate to My OKRs
//     await page.goto('/my-okrs')
//     await expect(page.getByTestId('my-okrs-page')).toBeVisible()

//     // Find first KR row and perform quick update
//     const firstKr = page.getByTestId(/^my-okrs-kr-/).first()
//     const krId = await firstKr.getAttribute('data-testid').then((id) => id!.replace('my-okrs-kr-', ''))
//     await page.getByTestId(`my-okrs-value-${krId}`).fill('42')
//     await page.getByTestId(`my-okrs-status-${krId}`).selectOption('GREEN')
//     await page.getByTestId(`my-okrs-comment-${krId}`).fill('Weekly progress')
//     await page.getByTestId(`my-okrs-save-${krId}`).click()
//     await expect(page.getByTestId('alert-success')).toBeVisible()

//     // Open history and validate entry and chip
//     await page.getByText('Show history').first().click()
//     await expect(page.getByTestId(`kr-history-${krId}`)).toBeVisible()
//     await expect(page.getByTestId(`kr-history-${krId}`)).toContainText('42')
//     await expect(page.getByText('On Track')).toBeVisible() // GREEN label
//   })
// })

