import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../',
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 7,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['line'],
    [
      'html',
      {
        outputFolder: '../playwright-report',
        open: 'never',
      },
    ],
  ],

  timeout: 120_000,

  expect: {
    timeout: 30_000,
  },
  globalSetup: './global.setup',

  use: {
    trace: 'off', // Warning: this leaks secrets into the trace logs
    ignoreHTTPSErrors: true,
    proxy: { server: process.env.PLAYWRIGHT_ZAP_PROXY },
  },

  projects: [
    {
      name: 'security',
      testMatch: '*.security.ts',
      use: {
        screenshot: 'on',
        baseURL: `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk`,
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 0,
        },
        video: 'on',
        viewport: {
          height: 1200,
          width: 1600,
        },
        headless: true,
      },
    },
  ],
});
