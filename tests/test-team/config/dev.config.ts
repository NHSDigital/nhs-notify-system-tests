import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  timeout: 120_000,

  expect: {
    timeout: 120_000,
  },
  globalSetup: './global.setup',

  use: {
    trace: 'off', // Warning: this leaks secrets into the trace logs
  },

  projects: [
    {
      name: 'e2e-dev',
      testMatch: '*cis2-login-e2e.ts',
      use: {
        screenshot: 'on',
        baseURL: 'https://main.web-gateway.dev.nhsnotify.national.nhs.uk',
        ...devices['Desktop Chrome'],
        headless: false,
        storageState: { cookies: [], origins: [] },
        launchOptions: {
          slowMo: 1100,
        },
        video: 'on'
      },
    },
  ],
});
