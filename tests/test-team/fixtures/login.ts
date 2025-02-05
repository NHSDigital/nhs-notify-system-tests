import fs from 'fs';
import { test as baseTest, BrowserContext, expect, Page } from '@playwright/test';
import { startPage } from '../functions/template-mgmt-e2e-common-steps';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';

type LoggedInPageFixture = {
  loggedInPage: Page;
};

const loggedInTest = baseTest.extend<LoggedInPageFixture>({
  loggedInPage: async ({ browser, baseURL }, use) => {
    if (!baseURL) {
      throw new Error('baseURL is not defined in Playwright config. Please ensure it is set.');
    }

    let context: BrowserContext;

    if (fs.existsSync('auth.json')) {
      context = await browser.newContext({ storageState: 'auth.json' });
    } else {
      context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(baseURL); // Ensure navigation before login

        await page.fill('input[name="username"]', '');
        await page.fill('input[name="password"]', '');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await page.waitForSelector('text=Message templates', { timeout: 10000 });

        await context.storageState({ path: 'auth.json' });
        console.log('auth.json created successfully!');
      } catch (error) {
        console.error('Error during login:', error);
        throw error;
      } finally {
        // await page.close();
      }
    }

    const page = await context.newPage();
try {
  await use(page);
} finally {
  await page.close(); // Close only after test runs
  await context.close();
}

  },
});

export { loggedInTest, expect };
