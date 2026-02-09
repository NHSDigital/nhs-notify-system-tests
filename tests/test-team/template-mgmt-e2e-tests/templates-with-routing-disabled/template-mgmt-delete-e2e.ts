/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  previewPage,
  startNewTemplate,
  deleteTemplate,
  createEmailTemplate,
} from '../../functions/template-mgmt-e2e-common-steps';

test.use({ storageState: 'login-state/delete.json' });

test(`User deletes a template`, async ({
  page,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };
  const channel = 'Email';
  const channelPath = 'email';
  const name = 'Test delete';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createEmailTemplate(page, name);
  await previewPage(props, channelPath, name);
  await deleteTemplate(props, name);
});
