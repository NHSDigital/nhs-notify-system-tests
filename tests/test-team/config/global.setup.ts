import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import generate from 'generate-password';
import { CognitoUserHelper, User } from '../helpers/cognito-user-helper';

dotenv.config();

let user: User;
let cognitoHelper: CognitoUserHelper;

async function globalSetup() {
  cognitoHelper = await CognitoUserHelper.init(`nhs-notify-${process.env.TARGET_ENVIRONMENT}-app`);
  const loginUrl = `https://${process.env.TARGET_ENVIRONMENT}.web-gateway.dev.nhsnotify.national.nhs.uk/auth`;
  console.log(loginUrl)
  try {
    if (!fs.existsSync('auth.json')) {
      console.log('Checking for auth.json...');
      console.log('File exists:', fs.existsSync('auth.json'));
      console.log('Storage state file not found. Creating a new one...');

      const password = generate.generate({
        length: 12,
        numbers: true,
        uppercase: true,
        symbols: true,
        strict: true,
      });

      user = await cognitoHelper.createUser(
        'product-tests-sign-in',
        password,
      );
      const browser = await chromium.launch();
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

      await context.storageState({ path: 'auth.json' });
      console.log('Storage state saved successfully.');

      await browser.close();
    } else {
      console.log('Storage state file already exists.');
    }
  } catch (error) {
    if (user) {
      await cognitoHelper.deleteUser(user.userId)
    }
    console.error('Global setup failed:', error);
    process.exit(1); // Force the process to exit with an error
  }
}

async function teardown() {
  if (user) {
    await cognitoHelper.deleteUser(user.userId)
  }

  if (fs.existsSync('auth.json')) {
    fs.unlinkSync('auth.json'); // Deletes the file
    console.log('Deleted auth.json');
  }
}

export default async function globalSetupAndTeardown() {
  await globalSetup();

  return async () => {
    await teardown();
  };
}
