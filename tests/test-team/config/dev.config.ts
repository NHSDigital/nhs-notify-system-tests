import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  timeout: 60_000,

  expect: {
    timeout: 30_000,
  },
  globalSetup: './global.setup',

  workers: 4,

  use: {
    trace: 'off', // Warning: this leaks secrets into the trace logs
  },

  projects: [
    {
      name: 'cis2-dev',
      testMatch: '*cis2-login-e2e.ts',
      use: {
        screenshot: 'on',
        baseURL: 'https://main.web-gateway.dev.nhsnotify.national.nhs.uk',
        ...devices['Desktop Chrome'],
        headless: false,
        storageState: { cookies: [], origins: [] },
        launchOptions: {
          slowMo: 100,
        },
        video: 'on'
      },
    },
    {
      name: 'e2e-dev',
      testMatch: '*-e2e.ts',
      use: {
        screenshot: 'on',
        baseURL: 'https://main.web-gateway.dev.nhsnotify.national.nhs.uk',
        ...devices['Desktop Chrome'],
        headless: false,
        storageState: 'auth.json',
        launchOptions: {
          slowMo: 100,
        },
        video: 'on'
      },
    },
  ],
});
