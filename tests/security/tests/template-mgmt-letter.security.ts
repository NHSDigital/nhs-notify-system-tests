/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import { TemplateMgmtLetterPage } from '../pages/template-mgmt-letter-page';
import {
  startPage,
  chooseTemplate,
  createLetterTemplate,
  startNewTemplate,
  requestProof,
} from '../functions/common-steps';

test.use({ storageState: 'login-state/primary.security.json' });

test(`User creates and submits a new letter template successfully`, async ({
  page,
  baseURL,
}) => {
  test.setTimeout(240_000); // override just for this test
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    letterPage: new TemplateMgmtLetterPage(page),
    baseURL,
  };
  const channel = 'Letter';
  const channelPath = 'letter';
  const name = 'E2E Name';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createLetterTemplate(props, name);
  await requestProof(props, channel, channelPath);
});
