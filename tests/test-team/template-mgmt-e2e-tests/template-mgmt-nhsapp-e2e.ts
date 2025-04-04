import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createTemplate,
  previewPage,
  submitPage,
  startNewTemplate,
} from '../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'auth.json' });

test(`User creates and submits a new email template successfully`, async ({
  page,
  baseURL,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };
  const channel = 'NHS App message';
  const channelPath = 'nhs-app';

    await startPage(props);
    await startNewTemplate(props);
    await chooseTemplate(props, channel);
    await createTemplate(props, channel, channelPath);
    await previewPage(props, channelPath);
    await submitPage(props, channelPath);
});
