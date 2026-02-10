/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createEmailTemplate,
  previewPage,
  startNewTemplate,
} from '../../functions/common-steps';

test.use({ storageState: 'login-state/primaryRoutingEnabled.json' });

test(`User creates and submits a new email template successfully`, async ({
  page,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };
  const channel = 'Email';
  const channelPath = 'email';
  const name = 'email template e2e test - routing enabled';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createEmailTemplate(page, name);
  await previewPage(props, channelPath, name);
});
