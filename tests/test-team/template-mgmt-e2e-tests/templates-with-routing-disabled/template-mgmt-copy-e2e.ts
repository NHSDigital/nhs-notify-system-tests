/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import { getRandomChannel } from 'nhs-notify-system-tests-shared';
import {
  startPage,
  chooseTemplate,
  createTemplate,
  previewPage,
  startNewTemplate,
  copyTemplate,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/copy.json' });

test(`User copies a template`, async ({ page, baseURL }) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };

  const randomChannel = getRandomChannel();
  const channel = randomChannel.name;
  const channelPath = randomChannel.path;
  const name = 'Test edit';

  console.log('name = ', channel, 'path = ', channelPath);

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath, name);
  await previewPage(props, channelPath, name);
  await copyTemplate(props, name);
});
