/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import { TemplateMgmtLetterPage } from '../../pages/template-mgmt-letter-page';
import {
  startPage,
  chooseTemplate,
  createLetterTemplate,
  startNewTemplate,
  requestProof,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/primaryRoutingEnabled.json' });

test(`User creates and submits a new letter template successfully - routing enabled`, async ({
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
  const language = 'en';
  const inputFileName = 'template.pdf';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createLetterTemplate(props, name, language, inputFileName);
  await requestProof(props, channel, channelPath);
});
