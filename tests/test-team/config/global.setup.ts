import { chromium } from '@playwright/test';
import fs from 'fs';

import dotenv from 'dotenv';

dotenv.config();

export default async function globalSetup() {
  const loginUrl = process.env.LOGIN_URL as string;
  console.log(loginUrl)
  try {
  if (!fs.existsSync('auth.json')) {
    console.log('Checking for auth.json...');
    console.log('File exists:', fs.existsSync('auth.json'));

    console.log('Storage state file not found. Creating a new one...');

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

    await page.fill('input[name="username"]', process.env.USER_NAME as string);
    await page.fill('input[name="password"]', process.env.PASSWORD as string);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForSelector('text=Create and submit a template to NHS NotifyUse this tool to create and submit', { timeout: 30000 });
    console.log('login complete');

    await context.storageState({path: 'auth.json'});
    console.log('Storage state saved successfully.');

    await browser.close();
    } else {
        console.log('Storage state file already exists.');
    }
  } catch(error){
    console.error('Global setup failed:', error);
    process.exit(1); // Force the process to exit with an error
  }

}
