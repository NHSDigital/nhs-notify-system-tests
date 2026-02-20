import { expect, Page } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  Cis2CredentialProvider,
  getCis2CredentialProvider,
} from 'nhs-notify-system-tests-shared';

async function enterVerificationCode(
  page: Page,
  cis2CredentialProvider: Cis2CredentialProvider,
) {
  await page.getByLabel('Enter verification code').fill(cis2CredentialProvider.totp());

  await page.getByText('Submit').click();

  await expect(
      page.getByText('Message templates')
    .or(
      page.getByText('Re-enter verification code')
    )
    .or(
      page.getByText('Sign in using an NHS account')
    )).toBeVisible({ timeout: 90_000 });

  if (await page.getByText('Message templates').isVisible()) {
    return;
  }

  if (await page.getByText('Re-enter verification code').isVisible()) {
    await page.getByText('Re-enter verification code').click();
    enterVerificationCode(page, cis2CredentialProvider);

    return;
  }

  if (await page.getByText('Sign in using an NHS account').isVisible()) {
    await cis2Login(page);

    return;
  }

  throw new Error('Unexpected outcome');
}

export async function cis2Login(
  page: Page,
) {
  const cis2CredentialProvider = await getCis2CredentialProvider();

  await page.waitForLoadState('load');

  await page.getByText("Log in with my Care Identity").click();

  await page.getByLabel("Authenticator app").click();

  await page.getByText('Continue').click();

  await page.getByLabel('What is your email address?').fill(cis2CredentialProvider.username);

  await page.getByLabel('What is your password?').fill(cis2CredentialProvider.password);

  await page.getByText('Continue').click();

  await enterVerificationCode(page, cis2CredentialProvider);
}

async function logOut(page: TemplateMgmtBasePage) {
  await page.logOut();
  await page.loginLink.waitFor();
  await expect(page.pageHeader).toHaveText('Sign in');
}

export { expect, logOut };
