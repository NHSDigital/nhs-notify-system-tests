/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import { getRandomChannel } from 'nhs-notify-system-tests-shared';
import {
  startPage,
  chooseTemplate,
  previewPage,
  startNewTemplate,
  copyTemplate,
  createEmailTemplate,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/copy.json' });

test(`User copies a template`, async ({ page }) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };

  const channel = 'Email';
  const channelPath = 'email';
  const name = 'copy template e2e test';

  console.log('name = ', channel, 'path = ', channelPath);

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createEmailTemplate(page, name);
  await previewPage(props, channelPath, name);
  await copyTemplate(props, name);
});
