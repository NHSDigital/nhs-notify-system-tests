/* eslint-disable security/detect-non-literal-regexp */

import { loginWithCis2, logOut } from '../fixtures/login';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  chooseTemplate,
  createTemplate,
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
  baseURL,
  page,
  context,
}) => {
  if (!baseURL) {
    throw new Error(`Missing baseURL ${baseURL}`);
  }

  const basePage = new TemplateMgmtBasePage(page);
  const props = {
    basePage,
    baseURL,
  };
  const channel = 'Email';
  const channelPath = 'email';
  const name = 'E2E Name';

  await startPage({ basePage, baseURL });
  await loginWithCis2(basePage, 'Message templates');
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath, name);
  await previewPage(props, channelPath, name);
  await context.storageState({ path: 'cis2.json' });
  await logOut(basePage);
  await page.waitForLoadState('networkidle');
  await startPage({ basePage, baseURL });
  await loginWithCis2(basePage, 'Message templates');
});
