/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createTemplate,
  previewPage,
  startNewTemplate,
  deleteTemplate,
} from '../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'auth.json' });

test(`User copies and then deletes a template`, async ({
  page,
  baseURL,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };
  const channel = 'Email';
  const channelPath = 'email';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath);
  await previewPage(props, channelPath);
  await page.locator('#maincontent').getByRole('link', { name: 'Back to all templates' }).click();
  await deleteTemplate(props, channelPath);
});
