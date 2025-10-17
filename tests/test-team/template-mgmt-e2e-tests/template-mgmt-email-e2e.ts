/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createTemplate,
  previewPage,
  submitPage,
  startNewTemplate,
  previewPageChooseSubmit,
} from '../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/primary.json' });

test(`User creates and submits a new email template successfully`, async ({
  page,
  baseURL,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };
  const channel = 'Email';
  const channelPath = 'email';
  const name = 'E2E Name';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath, name);
  await previewPage(props, channelPath, name);
  await previewPageChooseSubmit(props, channelPath);
  await submitPage(props, channelPath, name);
});
