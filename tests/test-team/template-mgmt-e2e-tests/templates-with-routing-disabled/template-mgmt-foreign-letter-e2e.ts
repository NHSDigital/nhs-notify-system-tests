/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import { TemplateMgmtLetterPage } from '../../pages/template-mgmt-letter-page';
import {
  startPage,
  chooseTemplate,
  createLetterTemplate,
  startNewTemplate,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/primary.json' });

const testConfigs = [
  {
    language: 'bn',
    inputFileName: 'Bengali.pdf',
  },
  { language: 'ar', inputFileName: 'Arabic.pdf' },
  {
    language: 'tr',
    inputFileName: 'Turkish.pdf',
  },
];

for (const { language, inputFileName } of testConfigs) {
  test(`User creates and submits a new letter template successfully - ${language})`, async ({
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
    const name = `E2E Name ${language}`;

    await startPage(props);
    await startNewTemplate(props);
    await chooseTemplate(props, channel);
    await createLetterTemplate(props, name, language, inputFileName);
  });
}
