import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  timeout: 60_000,

  expect: {
    timeout: 30_000,
  },
  globalSetup: './global.setup',

  workers: 6,

  use: {
    trace: 'off', // Warning: this leaks secrets into the trace logs
    ...(process.env.PLAYWRIGHT_ZAP_PROXY && {
      ignoreHTTPSErrors: true,
      proxy: { server: process.env.PLAYWRIGHT_ZAP_PROXY }
    })
  },

  projects: [
    {
      name: 'product',
      testMatch: '*-e2e.ts',
      use: {
        screenshot: 'on',
        baseURL: `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk`,
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 100,
        },
        video: 'on',
        headless: false
      },
    },
  ],
});
