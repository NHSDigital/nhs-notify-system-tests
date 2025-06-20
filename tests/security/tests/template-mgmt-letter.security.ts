/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../test-team/pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createTemplate,
  startNewTemplate,
} from '../../test-team/functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'auth.json' });

test(`User creates and submits a new letter template successfully`, async ({
  page,
  baseURL,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };
  const channel = 'Letter';
  const channelPath = 'letter';
  const name = 'E2E Name';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath, name);
});
