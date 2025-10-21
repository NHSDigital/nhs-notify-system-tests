/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import { TemplateMgmtLetterPage } from '../pages/template-mgmt-letter-page';
import {
  startPage,
  chooseTemplate,
  createLetterTemplate,
  startNewTemplate,
} from '../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'auth.json' });

// test(`User creates and submits a new letter template successfully`, async ({
//   page,
//   baseURL,
// }) => {
//   test.setTimeout(240_000); // override just for this test
//   const props = {
//     basePage: new TemplateMgmtBasePage(page),
//     letterPage: new TemplateMgmtLetterPage(page),
//     baseURL,
//   };
//   const channel = 'Letter';
//   const channelPath = 'letter';
//   const name = 'E2E Name';

  const testConfigs = [
  { language: 'bn', inputFileName: 'AW25 flu-only letter (65+) v1 Bengali.pdf' },
  { language: 'ar', inputFileName: 'AW25 flu-only letter (65+) v1 Arabic.pdf' },
  { language: 'tr', inputFileName: 'AW25 flu-only letter (65+) v1 Turkish.pdf' },
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
    })
  }
