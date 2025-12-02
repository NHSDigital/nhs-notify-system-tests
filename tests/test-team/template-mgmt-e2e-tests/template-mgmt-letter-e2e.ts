import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import { TemplateMgmtLetterPage } from '../pages/template-mgmt-letter-page';
import {
  startPage,
  chooseTemplate,
  createLetterTemplate,
  startNewTemplate,
  requestProof,
} from '../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/primary.json' });

test(`should create and submit a new letter template successfully`, async ({
  page,
  baseURL,
}) => {
  // allowable timeout: letter template creation may require extra time for file upload and proof generation
  test.setTimeout(240_000);
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
