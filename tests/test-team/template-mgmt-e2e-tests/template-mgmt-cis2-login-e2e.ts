/* eslint-disable security/detect-non-literal-regexp */

import { loginWithCis2, logOut } from "../fixtures/login";
import { TemplateMgmtBasePage } from "../pages/template-mgmt-base-page";
import {
  chooseTemplate,
  createTemplate,
  previewPage,
  startNewTemplate,
} from "../functions/template-mgmt-e2e-common-steps";
import test from "playwright/test";

test.use({ storageState: { cookies: [], origins: [] }});

test("User logs in via CIS2 and submits a template successfully", async ({
  baseURL,
  page,
}) => {
  if (!baseURL) {
    throw new Error(`Missing baseURL ${baseURL}`);
  }

  const basePage = new TemplateMgmtBasePage(page);
  const props = {
    basePage,
    baseURL,
  };
  const channel = "Email";
  const channelPath = "email";

  await loginWithCis2(baseURL, basePage, 'Message templates');
  await startNewTemplate(props);
  await chooseTemplate(props, channel);
  await createTemplate(props, channel, channelPath);
  await previewPage(props, channelPath);
  await logOut(basePage);
  await loginWithCis2(baseURL, basePage, 'Message templates')
});
