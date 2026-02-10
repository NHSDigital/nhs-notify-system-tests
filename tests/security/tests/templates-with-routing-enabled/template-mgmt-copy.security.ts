/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createEmailTemplate,
  previewPage,
  startNewTemplate,
  copyTemplate,
} from '../../functions/common-steps';

test.use({ storageState: 'login-state/copyRoutingEnabled.json' });

test(`User copies a template`, async ({ page }) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };

  const channel = 'Email';
  const channelPath = 'email';
  const name = 'copy template e2e test - routing enabled';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createEmailTemplate(page, name);
  await previewPage(props, channelPath, name);
  await copyTemplate(props, name);
});
