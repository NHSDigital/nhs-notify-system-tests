import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  timeout: 45_000,

  expect: {
    timeout: 45_000,
  },

  projects: [
    {
      name: 'e2e-dev',
      testMatch: '*-cis2-login-e2e.ts',
      use: {
        screenshot: 'on',
        baseURL: 'https://main.web-gateway.dev.nhsnotify.national.nhs.uk',
        ...devices['Desktop Chrome'],
        headless: false,
        storageState: { cookies: [], origins: [] },
        launchOptions: {
          slowMo: 200,
        },
        video: 'on'
      },
    },
  ],
});
