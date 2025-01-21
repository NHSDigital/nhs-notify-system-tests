import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  timeout: 10_000,

  expect: {
    timeout: 10_000,
  },

  projects: [
    {
      name: 'e2e-dev',
      testMatch: '*-e2e.ts',
      use: {
        screenshot: 'only-on-failure',
        baseURL: 'https://main.web-gateway.dev.nhsnotify.national.nhs.uk/templates/create-and-submit-templates',
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          slowMo: 500,
        },
      },
    },
  ],
});
