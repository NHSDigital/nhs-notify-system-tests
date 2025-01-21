import fs from 'fs';
import { test as baseTest, BrowserContext, expect, Page } from '@playwright/test';
import { startPage } from '../functions/template-mgmt-e2e-common-steps';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';

// Extend the base test to add a logged-in page fixture
type LoggedInPageFixture = {
  loggedInPage: Page;
};

// Create a test with a custom fixture
const test = baseTest.extend<LoggedInPageFixture>({
  loggedInPage: async ({ browser, baseURL }, use) => {
    if (!baseURL) {
      throw new Error('baseURL is not defined in Playwright config. Please ensure it is set.');
    }

    let context: BrowserContext;

    // Check if auth.json exists
    if (fs.existsSync('auth.json')) {
      // Reuse the stored authentication state
      context = await browser.newContext({
        storageState: 'auth.json',
      });
    } else {
      // If auth.json does not exist, create a new browser context and login
      context = await browser.newContext();
      const page = await context.newPage();

      try {
        const props = {
          basePage: new TemplateMgmtBasePage(page),
          baseURL,
        };

        await startPage(props);

        // Perform login actions
        await page.fill('input[name="username"]', '');
        await page.fill('input[name="password"]', '');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await page.waitForSelector('text=Message templates', { timeout: 10000 });

        // Optionally save the storage state for reuse
        await context.storageState({ path: 'auth.json' });
        console.log('auth.json created successfully!');
      } catch (error) {
        console.error('Error during login:', error);
        throw error;
      }
    }

    // Create a new page and pass it to the test
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      // Cleanup
      await context.close();
    }
  },
});

export { test as loggedInTest, expect };
