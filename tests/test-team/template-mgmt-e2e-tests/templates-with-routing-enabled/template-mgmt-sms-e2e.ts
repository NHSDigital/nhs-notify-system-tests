/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  previewPage,
  startNewTemplate,
  createSmsTemplate,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/primaryRoutingEnabled.json' });

test(`User creates and submits a new sms template successfully - routing enabled`, async ({
  page,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };
  const channel = 'Text message (SMS)';
  const channelPath = 'text-message';
  const name = 'E2E Name';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createSmsTemplate(page, name);
  await previewPage(props, channelPath, name);
});
