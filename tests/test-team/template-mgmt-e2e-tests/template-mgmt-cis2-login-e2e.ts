/* eslint-disable security/detect-non-literal-regexp */

import { cis2Login, logOut } from '../functions/login';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  chooseTemplate,
  createEmailTemplate,
  previewPage,
  startNewTemplate,
  startPage,
} from '../functions/template-mgmt-e2e-common-steps';
import test from 'playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Intention is to cover:
 * - Logging in with CIS2
 * - Accessing the service behind the web-gateway (as the client's URL is important to the configuration of Cognito)
 * - Using the access token in the templates app to create data (because this will need to obtain the user's ID token from Cognito)
 * - Log out
 * - Log back in, this should require the user to re-enter credentials proving that
 *    - log out worked and
 *    - CIS2 'prompt=login' works to force a re-authentication
 */
test('User logs in via CIS2, saves data in templates, logs out and logs back in again', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);

  const basePage = new TemplateMgmtBasePage(page);
  const props = {
    basePage,
  };
  const channel = 'Email';
  const channelPath = 'email';
  const name = 'CIS2 login test';

  await startPage({ basePage });
  await cis2Login(basePage.page);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createEmailTemplate(page, name);
  await previewPage(props, channelPath, name);
  await context.storageState({ path: 'login-state/cis2.json' });
  await logOut(basePage);
  await page.waitForLoadState('networkidle');
  await startPage({ basePage });
  await cis2Login(basePage.page);
});
