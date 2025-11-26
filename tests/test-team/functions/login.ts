import { expect, Page } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  Cis2CredentialProvider,
  getCis2Credentials,
} from 'nhs-notify-system-tests-shared';

async function enterCis2TotpCode(
  page: Page,
  cis2Credentials: Cis2CredentialProvider,
  targetHeadingText: string
) {
  await page.getByLabel('Enter verification code').fill(cis2Credentials.totp());
  await page.getByText(/\W+Submit\W+/).click();

  const happyPathSelector = page.getByText(targetHeadingText);
  const reVerificationSelector = page.locator(
    `//button[text()=' Re-enter verification code ']`
  );

  await happyPathSelector
    .or(reVerificationSelector)
    .waitFor({ timeout: 30_000 });
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
    const success = await enterCis2TotpCode(
      page,
      cis2Credentials,
      targetHeadingText
    );
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
    const cis2Button = page.getByText('Log in with my Care Identity');
    await page.waitForLoadState('networkidle');
    await cis2Button.click();

    // CIS2 - Select credentials type
    await page.getByLabel('Authenticator app').click();
    await page.getByText(/\W+Continue\W+/).click();
    await page.waitForSelector(`//input[@name='password']`);

    // CIS2 - Username/password form
    await page.fill('input[name="email"]', cis2Credentials.username);
    await page.fill('input[name="password"]', cis2Credentials.password);
    await page.getByText(/\W+Continue\W+/).click();
    await expect(page.getByText('Enter verification code')).toBeVisible();

    // CIS2 - TOTP form
    await enterCis2TotpCodeWithRetry(page, cis2Credentials, targetHeadingText);
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

async function logOut(page: TemplateMgmtBasePage) {
  await page.logOut();
  await page.loginLink.waitFor();
  await expect(page.pageHeader).toHaveText('Sign in');
}

export { loginWithCis2, expect, logOut };
