/* eslint-disable security/detect-non-literal-regexp */

import { loggedInTest, expect } from '../fixtures/login';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  chooseTemplate,
  createTemplate,
  previewPage,
  submitPage,
  startNewTemplate,
} from '../functions/template-mgmt-e2e-common-steps';

loggedInTest(`User creates and submits a new email template successfully`, async ({
  baseURL,
  loggedInPage,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(loggedInPage),
    baseURL,
  };
  const channel = 'Email';
  const channelPath = 'email';

  //await startPage(props);  Moved to login fixture
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath);
  await previewPage(props, channelPath);
  await submitPage(props, channelPath);
});
