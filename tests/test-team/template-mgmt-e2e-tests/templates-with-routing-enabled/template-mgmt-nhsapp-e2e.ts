import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createTemplate,
  previewPage,
  submitPage,
  startNewTemplate,
  previewPageChooseSubmit,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/primaryRoutingEnabled.json' });

test(`User creates and submits a new nhsapp template successfully - routing enabled`, async ({
  page,
  baseURL,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
    baseURL,
  };
  const channel = 'NHS App message';
  const channelPath = 'nhs-app';
  const name = 'E2E Name';

    await startPage(props);
    await startNewTemplate(props);
    await chooseTemplate(props, channel);
    await createTemplate(props, channel, channelPath, name);
    await previewPage(props, channelPath, name);
    await previewPageChooseSubmit(props, channelPath);
    await submitPage(props, channelPath, name);
});
