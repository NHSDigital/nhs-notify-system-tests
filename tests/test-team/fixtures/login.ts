import fs from "fs";
import {
  test as baseTest,
  BrowserContext,
  expect,
  Page,
} from "@playwright/test";
import { startPage } from "../functions/template-mgmt-e2e-common-steps";
import { TemplateMgmtBasePage } from "../pages/template-mgmt-base-page";
import {
  Cis2CredentialProvider,
  getCis2Credentials,
} from "../helpers/cis2-credentials-provider";

// Extend the base test to add a logged-in page fixture
type LoggedInPageFixture = {
  loggedInWithCognitoPage: Page;
  loggedInWithCis2Page: Page;
};

// Create a test with a custom fixture
const test = baseTest.extend<LoggedInPageFixture>({
  loggedInWithCognitoPage: async ({ browser, baseURL }, use) => {
    if (!baseURL) {
      throw new Error(
        "baseURL is not defined in Playwright config. Please ensure it is set."
      );
    }

    let context: BrowserContext;

    // Check if auth.json exists
    if (fs.existsSync("auth.json")) {
      // Reuse the stored authentication state
      context = await browser.newContext({
        storageState: "auth.json",
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
        await page.fill('input[name="username"]', "");
        await page.fill('input[name="password"]', "");
        await page.getByRole("button", { name: "Sign in" }).click();

        await page.waitForSelector("text=Message templates", {
          timeout: 10000,
        });

        // Optionally save the storage state for reuse
        await context.storageState({ path: "auth.json" });
        console.log("auth.json created successfully!");
      } catch (error) {
        console.error("Error during login:", error);
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
  loggedInWithCis2Page: async ({ browser, baseURL }, use) => {
    if (!baseURL) {
      throw new Error(
        "baseURL is not defined in Playwright config. Please ensure it is set."
      );
    }

    let context: BrowserContext;

    const cis2Credentials = await getCis2Credentials();

    // If auth.json does not exist, create a new browser context and login
    context = await browser.newContext();
    const page = await context.newPage();

    try {
      const props = {
        basePage: new TemplateMgmtBasePage(page),
        baseURL,
      };

      await startPage(props);

      // Click the CIS2 login button
      await page.getByAltText("NHS Care Identity").click();

      await page.getByLabel("Authenticator app").click();

      await page.getByText(/\W+Continue\W+/).click();
      await page.waitForSelector(`//input[@name='password']`);

      await page.fill('input[name="email"]', cis2Credentials.username);
      await page.fill('input[name="password"]', cis2Credentials.password);
      await page.getByText(/\W+Continue\W+/).click();
      await page.waitForSelector(
        `//input[@data-vv-as='Enter verification code']`
      );

      await page
        .locator(`//input[@data-vv-as='Enter verification code']`)
        .fill(cis2Credentials.totp());
      await page.getByText(/\W+Submit\W+/).click();

      await page.waitForSelector("text=Message templates", {
        timeout: 30000,
      });
      await use(page);
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  },
});

async function waitForSelector(
  selector: string,
  page: Page,
  timeout: number
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, {
      timeout,
    });
  } catch (_) {
    return Promise.resolve(false);
  }
  return Promise.resolve(true);
}

async function enterCis2TotpCode(
  page: Page,
  cis2Credentials: Cis2CredentialProvider,
  targetHeadingText: string
) {
  await page
    .locator(`//input[@data-vv-as='Enter verification code']`)
    .fill(cis2Credentials.totp());
  await page.getByText(/\W+Submit\W+/).click();

  const happyPathSelector = page.getByText(targetHeadingText);
  const reVerificationSelector = page.locator(`//button[text()=' Re-enter verification code ']`);

  await happyPathSelector.or(reVerificationSelector).waitFor({ timeout: 20_000 });
  if (await happyPathSelector.isVisible()) {
    return true;
  }
  return false;
}

async function enterCis2TotpCodeWithRetry(
  page: Page,
  cis2Credentials: Cis2CredentialProvider,
  targetHeadingText: string
) {
  for (var i=0; i<3; i++) {
    const success = await enterCis2TotpCode(page, cis2Credentials, targetHeadingText);
    if (success) {
      return;
    }
    await page.getByText(/\W+Re-enter verification code\W+/).click();
  }
}

async function loginWithCis2(
  baseURL: string,
  basePage: TemplateMgmtBasePage,
  targetHeadingText: string
) {
  const cis2Credentials = await getCis2Credentials();
  const page = basePage.page;

  try {
    await startPage({ basePage, baseURL });

    // Notify WebUI - Click the CIS2 login button
    await page.getByAltText("NHS Care Identity").click();

    // CIS2 - Select credetials type
    await page.getByLabel("Authenticator app").click();
    await page.getByText(/\W+Continue\W+/).click();
    await page.waitForSelector(`//input[@name='password']`);

    // CIS2 - Username/password form
    await page.fill('input[name="email"]', cis2Credentials.username);
    await page.fill('input[name="password"]', cis2Credentials.password);
    await page.getByText(/\W+Continue\W+/).click();
    await page.waitForSelector(
      `//input[@data-vv-as='Enter verification code']`
    );

    // CIS2 - TOTP form
    await enterCis2TotpCodeWithRetry(page, cis2Credentials, targetHeadingText);
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
}

async function logOut(page: TemplateMgmtBasePage) {
  await page.logOut();
  await page.loginLink.waitFor();
}

export { test as loggedInTest, loginWithCis2, expect, logOut };
