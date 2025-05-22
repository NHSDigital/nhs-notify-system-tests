import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import generate from 'generate-password';
import { CognitoUserHelper, User } from '../helpers/cognito-user-helper';

dotenv.config();

let user: User;
let cognitoHelper: CognitoUserHelper;
let createdUsers: User[] = [];

async function createStorageStateFile(username: string, fileName: string) {
  cognitoHelper = await CognitoUserHelper.init(`nhs-notify-${process.env.TARGET_ENVIRONMENT}-app`);
  const loginUrl = `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk/auth`;
  console.log(loginUrl)
  try {
    if (!fs.existsSync(fileName)) {
      console.log('Checking for ', fileName);
      console.log('File exists:', fs.existsSync(fileName));
      console.log('Storage state file not found. Creating a new one...');

      const password = generate.generate({
        length: 12,
        numbers: true,
        uppercase: true,
        symbols: true,
        strict: true,
      });

      // let user: { email: any; userId?: string; };

      user = await cognitoHelper.createUser(
        username,
        password,
      );
      const browser = await chromium.launch({headless: true,slowMo: 0});
      const context = await browser.newContext();
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
    } else {
      console.log('Storage state file already exists.');
    }
    return user;
  } catch (error) {
    if (user) {
      await cognitoHelper.deleteUser(user.userId)
    }
    console.error('Global setup failed:', error);
    // process.exit(1); // Force the process to exit with an error
    throw error;
  }
}

async function globalSetup() {
  const user1 = await createStorageStateFile('product-tests-sign-in', 'auth.json');
  const user2 = await createStorageStateFile('copy-tests-sign-in', 'copy.json');
  const user3 = await createStorageStateFile('delete-tests-sign-in', 'delete.json');

  createdUsers.push(user1, user2, user3);

  // Save to a temp file to access in teardown, since globalSetup and globalTeardown run separately
  const fs = require('fs');
  fs.writeFileSync('./createdUsers.json', JSON.stringify(createdUsers, null, 2));
}

export default async function globalSetupAndTeardown() {
  await globalSetup();
}
