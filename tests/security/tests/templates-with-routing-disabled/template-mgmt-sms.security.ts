/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createSmsTemplate,
  previewPage,
  submitPage,
  startNewTemplate,
  previewPageChooseSubmit,
} from '../../functions/common-steps';

test.use({ storageState: 'login-state/primary.json' });

test(`User creates and submits a new sms template successfully`, async ({
  page,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };
  const channel = 'Text message (SMS)';
  const channelPath = 'text-message';
  const name = 'SMS template e2e test';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createSmsTemplate(page, name);
  await previewPage(props, channelPath, name);
  await previewPageChooseSubmit(props, channelPath);
  await submitPage(props, channelPath, name);
});
