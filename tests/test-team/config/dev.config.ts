import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  timeout: 10_000,

  expect: {
    timeout: 10_000,
  },
  globalSetup: './global.setup',

  use: {
    trace: 'retain-on-failure', // Options: 'on', 'off', 'retain-on-failure', 'on-first-retry'
  },


  projects: [
    {
      name: 'e2e-dev',
      testMatch: '*sms-e2e.ts',
      use: {
        screenshot: 'only-on-failure',
        baseURL: 'https://main.web-gateway.dev.nhsnotify.national.nhs.uk',
        ...devices['Desktop Chrome'],
        headless: false,
        storageState: 'auth.json', // Load saved authentication state
        launchOptions: {
          slowMo: 100,
        },
      },
    },
  ],
});
