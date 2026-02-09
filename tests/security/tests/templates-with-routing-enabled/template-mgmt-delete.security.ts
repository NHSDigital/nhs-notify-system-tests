/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createTemplate,
  previewPage,
  startNewTemplate,
  deleteTemplate,
} from '../../functions/common-steps';

test.use({ storageState: 'login-state/deleteRoutingEnabled.json' });

test(`User deletes a template`, async ({
  page,
  baseURL,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };
  const channel = 'Email';
  const channelPath = 'email';
  const name = 'Test delete'

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath, name);
  await previewPage(props, channelPath, name);
  await deleteTemplate(props, name);
});
