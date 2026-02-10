import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createNhsAppTemplate,
  previewPage,
  startNewTemplate,
} from '../../functions/common-steps';

test.use({ storageState: 'login-state/primaryRoutingEnabled.json' });

test(`User creates and submits a new nhsapp template successfully`, async ({
  page,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };
  const channel = 'NHS App message';
  const channelPath = 'nhs-app';
  const name = 'nhs app template e2e test - routing enabled';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createNhsAppTemplate(page, name);
  await previewPage(props, channelPath, name);
});
