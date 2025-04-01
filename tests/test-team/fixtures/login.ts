import {
  expect,
  Page,
} from "@playwright/test";
import { TemplateMgmtBasePage } from "../pages/template-mgmt-base-page";
import {
  Cis2CredentialProvider,
  getCis2Credentials,
} from "../helpers/cis2-credentials-provider";

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
  for (var i = 0; i < 3; i++) {
    const success = await enterCis2TotpCode(page, cis2Credentials, targetHeadingText);
    if (success) {
      return;
    }
    await page.getByText(/\W+Re-enter verification code\W+/).click();
  }
}

async function loginWithCis2(
  basePage: TemplateMgmtBasePage,
  targetHeadingText: string
) {
  const cis2Credentials = await getCis2Credentials();
  const page = basePage.page;

  try {
    // Notify WebUI - Click the CIS2 login button
    await page.getByAltText("Log in with my Care Identity").click();

    // CIS2 - Select credentials type
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
  await page.loginLink.waitFor({ state: 'visible' });
}

export { loginWithCis2, expect, logOut };
