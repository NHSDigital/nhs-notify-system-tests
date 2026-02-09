/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  previewPage,
  startNewTemplate,
  copyTemplate,
  createEmailTemplate,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/copyRoutingEnabled.json' });

test(`User copies a template - routing enabled`, async ({ page, baseURL }) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };

  const channel = 'Email';
  const channelPath = 'email';
  const name = 'Test edit';

  console.log('name = ', channel, 'path = ', channelPath);

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createEmailTemplate(page, name);
  await previewPage(props, channelPath, name);
  await copyTemplate(props, name, true);
});
