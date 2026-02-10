/* eslint-disable security/detect-non-literal-regexp */

import { test } from '@playwright/test';
import { TemplateMgmtBasePage } from '../../pages/template-mgmt-base-page';
import {
  startPage,
  chooseTemplate,
  createEmailTemplate,
  previewPage,
  startNewTemplate,
  deleteTemplate,
} from '../../functions/common-steps';

test.use({ storageState: 'login-state/delete.json' });

test(`User deletes a template`, async ({
  page,
}) => {
  const props = {
    basePage: new TemplateMgmtBasePage(page),
  };

  const channel = 'Email';
  const channelPath = 'email';
  const name = 'delete template e2e test';

  await startPage(props);
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createEmailTemplate(page, name);
  await previewPage(props, channelPath, name);
  await deleteTemplate(props, name);
});
