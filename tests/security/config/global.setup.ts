import { chromium } from '@playwright/test';
import fs from 'fs';
import generate from 'generate-password';
import {
  CognitoUserHelper,
  TestClientConfig,
} from 'nhs-notify-system-tests-shared';
import { z } from 'zod';

let cognitoHelper: CognitoUserHelper;

const $TestClientConfig = z.object({
  id: z.string(),
  name: z.string(),
  campaignId: z.string().optional(),
  features: z.object({
    proofing: z.boolean(),
  }),
});

function getStaticClientData() {
  return z
    .object({ clients: z.record(z.string(), $TestClientConfig) })
    .parse(JSON.parse(fs.readFileSync('./fixtures/clients.json', 'utf8')));
}

async function createStorageStateFile(
  username: string,
  testClientConfig: TestClientConfig,
  fileName: string
) {
  cognitoHelper ??= await CognitoUserHelper.init(
    process.env.TARGET_ENVIRONMENT!
  );
  const loginUrl = `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk/auth`;

  let user;

  try {
    const password = generate.generate({
      length: 12,
      numbers: true,
      uppercase: true,
      symbols: true,
      strict: true,
    });

    user = await cognitoHelper.createUser(username, password, testClientConfig);
    const browser = await chromium.launch({ headless: true, slowMo: 0 });
    const context = await browser.newContext({
    acceptDownloads: true});
    const page = await context.newPage();

    try {
      await page.goto(loginUrl);
      console.log('Page loaded successfully');
    } catch (error) {
      console.error('Failed to load page:', error);
    }

    await page.getByRole('link', { name: 'Sign in' }).click();
    console.log('Login button clicked');

    await page.fill('input[name="username"]', user.email as string);
    await page.fill('input[name="password"]', password as string);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForSelector('text=Message templates', { timeout: 30000 });
    console.log('login complete');

    await context.storageState({ path: fileName });
    console.log('Storage state saved successfully.');

    await browser.close();

    return user;
  } catch (error) {
    if (user) {
      await cognitoHelper.deleteUser(user.userId, user.clientId);
    }
    console.error('Global setup failed:', error);
    throw error;
  }
}

async function globalSetup() {
  const { clients } = getStaticClientData();

  const createdUsers = await Promise.all([
    createStorageStateFile(
      'product-tests-sign-in.security',
      clients['Client1'],
      'auth.json'
    ),
    createStorageStateFile(
      'copy-tests-sign-in.security',
      clients['Client2'],
      'copy.json'
    ),
    createStorageStateFile(
      'delete-tests-sign-in.security',
      clients['Client3'],
      'delete.json'
    ),
  ]);

  // Save to a temp file to access in teardown, since globalSetup and globalTeardown run separately
  fs.writeFileSync(
    './createdUsers.json',
    JSON.stringify(createdUsers, null, 2)
  );
}

export default async function globalSetupAndTeardown() {
  await globalSetup();
}
