import { chromium } from '@playwright/test';
import { StateFile } from 'nhs-notify-system-tests-shared';
import path from 'node:path';
import { mkdir, readdir, rm, unlink } from 'node:fs/promises';
import z from 'zod';

async function login(userKey: string, username: string, password: string) {
  const loginUrl = `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk/auth`;

  const browser = await chromium.launch({ headless: true, slowMo: 0 });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();

  try {
    await page.goto(loginUrl);
    console.log('Page loaded successfully');
  } catch (error) {
    console.error('Failed to load page:', error);
  }

  await page.getByRole('link', { name: 'Sign in' }).click();
  console.log('Login button clicked');

  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForSelector('text=Message templates', { timeout: 30000 });
  console.log('login complete');

  await context.storageState({ path: `login-state/${userKey}.json` });
  console.log('Storage state saved successfully.');

  await browser.close();
}

async function cleanupLoginState() {
  await rm('login-state', { recursive: true, force: true });
  await mkdir('login-state');
}

async function globalSetup() {
  await cleanupLoginState();

  const authSetupStateFile = new StateFile(
    './lifecycle/auth',
    process.env.RUN_ID
  );

  await authSetupStateFile.loadFromDisk();

  const createdUsers = Object.entries(
    authSetupStateFile.getValues(
      'users',
      z.record(
        z.string(),
        z.object({ username: z.string(), password: z.string() })
      )
    )
  );

  await Promise.all(
    createdUsers.map(([userKey, { username, password }]) =>
      login(userKey, username, password)
    )
  );
}

export default globalSetup;
