/* eslint-disable security/detect-non-literal-regexp */

import path, { dirname } from 'node:path';
import { expect, Page, test } from '@playwright/test';
import { StateFile } from 'nhs-notify-system-tests-shared';
import z, { string } from 'zod';

test.use({ storageState: 'login-state/routingEnabled.json' });

const getSeededTemplateConfig = async (configFile: string | undefined) => {

    const projectRoot = path.resolve(dirname(configFile ?? ''), '..');

    const templatesStateFile = new StateFile(
      path.join(projectRoot, 'lifecycle', 'templates'),
      process.env.RUN_ID
    );

    await templatesStateFile.loadFromDisk();

    return templatesStateFile.getValues(
      'templates',
      z.record(z.string(), z.object({
        id: z.string(),
        name: string(),
        message: string(),
      })),
    );
}

const previewAndSelectTemplate = async (
  page: Page,
  baseURL: string | undefined,
  routingConfigId: string,
  channel: string,
  channelUrlSegment: string,
  { id: templateId, name: templateName, message: templateMessage }: { id: string, name: string, message: string },
) => {

  await page.getByTestId(`choose-template-link-${channel}`).click();

  await expect(page).toHaveURL(new RegExp(`${baseURL}/templates/message-plans/choose-${channelUrlSegment}-template/${routingConfigId}\?(.*)`));

  await page.getByTestId(`${templateId}-preview-link`).click();

  await expect(page).toHaveURL(new RegExp(`${baseURL}/templates/message-plans/choose-${channelUrlSegment}-template/${routingConfigId}/preview-template/${templateId}\?(.*)`));

  await expect(page.getByText(templateId)).toBeVisible();
  await expect(page.getByText(templateName)).toBeVisible();
  await expect(page.getByText(templateMessage)).toBeVisible();

  await page.getByTestId('back-link-bottom').click();

  await expect(page).toHaveURL(new RegExp(`${baseURL}/templates/message-plans/choose-${channelUrlSegment}-template/${routingConfigId}\?(.*)`));

  await page.getByTestId(`${templateId}-radio`).check();

  await page.getByText('Save and continue').click();

  await expect(page).toHaveURL(new RegExp(`${baseURL}/templates/message-plans/choose-templates/${routingConfigId}(.*)`));
}

test(`User creates a multi-channel routing config`, async ({ page, baseURL, }, { config: { configFile } }) => {

  const templates = await getSeededTemplateConfig(configFile);
  await page.goto(`${baseURL}/templates/message-plans`);

  await page.getByText('New message plan').click();

  await expect(page).toHaveURL(`${baseURL}/templates/message-plans/choose-message-order`);

  await page.getByLabel('NHS App, Email, Text message', { exact: true }).check();

  await page.getByText('Save and continue').click();

  await expect(page).toHaveURL(`${baseURL}/templates/message-plans/create-message-plan?messageOrder=NHSAPP%2CEMAIL%2CSMS`);

  await page.getByLabel('Message plan name').fill('message plan name');

  await page.getByText('Save and continue').click();

  await expect(page).toHaveURL(new RegExp(`${baseURL}/templates/message-plans/choose-templates/(.*)`));

  const urlSegments = page.url().split('/');
  const routingConfigId = urlSegments[urlSegments.length - 1];

  await previewAndSelectTemplate(
    page,
    baseURL,
    routingConfigId,
    'NHSAPP',
    'nhs-app',
    templates['multiChannelRoutingConfigNhsApp']
  );
  await previewAndSelectTemplate(
    page,
    baseURL,
    routingConfigId,
    'EMAIL',
    'email',
    templates['multiChannelRoutingConfigEmail']
  );
  await previewAndSelectTemplate(
    page,
    baseURL,
    routingConfigId,
    'SMS',
    'text-message',
    templates['multiChannelRoutingConfigSms']
  );

  await page.getByText('Move to production').click();

  await expect(page).toHaveURL(new RegExp(`${baseURL}/templates/message-plans/get-ready-to-move/${routingConfigId}(.*)`));

  await page.getByText('Continue').click();

  // remaining pages not ready yet
});
