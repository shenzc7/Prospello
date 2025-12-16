import type { PlaywrightTestConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const webServerEnv = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/okrflow?schema=public',
  NEXTAUTH_URL: baseURL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-change-me-please',
  CRON_SECRET: process.env.CRON_SECRET || 'dev-cron-secret-change-me',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
}

const config: PlaywrightTestConfig = {
  testDir: 'e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev:webpack',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: webServerEnv,
  },
}

export default config











