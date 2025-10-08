import { test, expect } from '@playwright/test';
import { TemplateMgmtBasePage } from '../pages/template-mgmt-base-page';
import { TemplateMgmtLetterPage } from '../pages/template-mgmt-letter-page';

type CommonStepsProps = {
  basePage: TemplateMgmtBasePage;
  baseURL?: string;
};

type CommonLetterStepsProps = CommonStepsProps & {
  letterPage: TemplateMgmtLetterPage;
};

export function startPage({ basePage, baseURL }: CommonStepsProps) {
  return test.step('start page', async () => {
    await basePage.navigateTo(
      `${baseURL}/templates/create-and-submit-templates`
    );
    await expect(basePage.page).toHaveURL(
      `${baseURL}/templates/create-and-submit-templates`
    );
    await expect(basePage.pageHeader).toHaveText(
      'Create and submit a template to NHS Notify'
    );
    await basePage.clickButtonByName('Start now');
  });
}

export function startNewTemplate({ basePage }: CommonStepsProps) {
  return test.step('start template process', async () => {
    await basePage.clickButtonByName('Create template');
  });
}

export function chooseTemplate(
  { basePage, baseURL }: CommonStepsProps,
  channel: string
) {
  return test.step('Choose template type', async () => {
    await expect(basePage.page).toHaveURL(
      `${baseURL}/templates/choose-a-template-type`
    );

    await expect(basePage.pageHeader).toHaveText(
      'Choose a template type to create'
    );

    await basePage.checkRadio(channel);

    await basePage.clickButtonByName('Continue');
  });
}

export function createLetterTemplate(
  { basePage, baseURL, letterPage }: CommonLetterStepsProps,
  name: string
) {
  return test.step('Create template', async () => {
    const pageSlug = 'upload-letter-template';

    await expect(basePage.page).toHaveURL(
      `${baseURL}/templates/${pageSlug}`
    );

    await expect(basePage.pageHeader).toHaveText(
      `Upload a letter template`
    );

    await basePage.fillTextBox('Template name', name);

    await letterPage.selectLetterOption('Letter type','x1');
    await letterPage.selectLetterOption('Letter language','fr');
    await letterPage.uploadLetterTemplate('Letter template PDF');
  });
}

export function createTemplate(
  { basePage, baseURL }: CommonStepsProps,
  channel: string,
  channelPath: string,
  name: string
) {
  return test.step('Create template', async () => {

    const pageSlug = `create-${channelPath}-template`

    await expect(basePage.page).toHaveURL(
      `${baseURL}/templates/${pageSlug}`
    );
    if (channel === 'Email') {
      await expect(basePage.pageHeader).toHaveText(`Create email template`);
    } else if (channel === 'Text message (SMS)') {
      await expect(basePage.pageHeader).toHaveText(
        `Create text message template`
      );
    } else {
      await expect(basePage.pageHeader).toHaveText(
        `Create ${channel} template`
      );
    }

    await basePage.fillTextBox('Template name', name);

    if (channel === 'Email') {
      await basePage.fillTextBox('Subject line', 'E2E subject');
    }

    await basePage.fillTextBox('Message', 'E2E Message');
    await basePage.clickButtonByName('Save and preview');

  });
}

export function requestProof(
  { basePage, baseURL, letterPage }: CommonLetterStepsProps,
  channel: string,
  channelPath: string,
) {
  return test.step('Request Proof', async () => {
    const maxRetries = 10;
    const retryInterval = 2000;
    await basePage.clickButtonByName('Request a proof');
    await basePage.clickButtonByName('Go back');
    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/preview-${channelPath}-template/(.*)`)
    );
    await basePage.clickButtonByName('Request a proof');
    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/request-proof-of-template/(.*)`)
    );
    await basePage.clickButtonByName('Request a proof');
    await basePage.checkStatus('Waiting for proof');
    await letterPage.waitForProofRequest();
    await letterPage.verifyFiles();
    await letterPage.submitLetterTemplate();

})
}

export function previewPage(
  { basePage, baseURL }: CommonStepsProps,
  channelPath: string,
  name: string
) {
  return test.step('Preview page', async () => {
    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/preview-${channelPath}-template/(.*)`)
    );

    await expect(basePage.pageHeader).toHaveText(name);
  });
}

export function previewPageChooseSubmit(
  { basePage, baseURL }: CommonStepsProps,
  channelPath: string,
) {
  return test.step('Preview page - select submit', async () => {
    await basePage.checkRadio('Submit template');

    await basePage.clickButtonByName('Continue');

    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/submit-${channelPath}-template/(.*)`)
    );
  });
}

export function deleteTemplate(
  { basePage, baseURL }: CommonStepsProps,
  name:string
) {
  return test.step('Delete template', async () => {
    await basePage.goBackLink.click();
    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/message-templates`)
    );
    const rowCount = await basePage.tableRows();

    await basePage.clickLinkByName('Delete ' + name);
    await basePage.clickButtonByName('No, go back');
    await expect(basePage.page).toHaveURL(
        // eslint-disable-next-line security/detect-non-literal-regexp
        new RegExp(`${baseURL}/templates/message-templates`)
      );
    let rowCountCheck = await basePage.tableRows();
    expect(rowCount).toBe(rowCount);

    await basePage.clickLinkByName('Delete ' + name);
    await basePage.clickButtonByName('Yes, delete template');
    await expect(basePage.page).toHaveURL(
        // eslint-disable-next-line security/detect-non-literal-regexp
        new RegExp(`${baseURL}/templates/message-templates`)
      );
    rowCountCheck = await basePage.tableRows();
    expect(rowCountCheck).toBe(rowCount-1);
    expect(basePage.templateToDelete).not.toBeVisible();
  });
}

export function copyTemplate(
  { basePage, baseURL }: CommonStepsProps,
  name:string
) {
  return test.step('Copy template', async () => {
    await basePage.goBackLink.click();
    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/message-templates`)
    );
    const rowCount = await basePage.tableRows();

    const copyLink = await basePage.page.$('#copy-template-link-0');
    if (copyLink) {
      await copyLink.click();
    } else {
      throw new Error(`No element with id 'copy-template-link-0' found`);
    }

    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/copy-template/(.*)`)
    );

    await basePage.checkRadio('Email');
    await basePage.clickButtonByName('Continue');

    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/message-templates`)
    );

    await basePage.page.reload(); // shouldn't need to do this

    await basePage.clickFirstTableRowLink();
    await basePage.checkRadio('Edit template');
    await basePage.clickButtonByName('Continue');
    const timestamp = Date.now();
    const editedTemplateName = `Test edit changed ${timestamp}`;
    await basePage.fillTextBox('Template name', editedTemplateName);
    await basePage.clickButtonByName('Save and preview');
    await expect(basePage.pageHeader).toHaveText(editedTemplateName);
    await basePage.clickBackLink();
    await basePage.page.waitForSelector('text=Message templates', { timeout: 10_000 });
    await basePage.waitForLoad();
    await expect(basePage.templateEdited(editedTemplateName)).toBeVisible();

    const rowCountCheck = await basePage.tableRows();
    expect(rowCountCheck).toBe(rowCount+1);
  });
}

export function submitPage(
  { basePage, baseURL }: CommonStepsProps,
  channelPath: string,
  name: string
) {
  return test.step('Submit page', async () => {
    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/submit-${channelPath}-template/(.*)`)
    );

    await expect(basePage.pageHeader).toHaveText('Submit ' + `'` + name + `'`);

    await basePage.clickButtonByName('Submit template');

    // Submitted Page
    await expect(basePage.page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      new RegExp(`${baseURL}/templates/${channelPath}-template-submitted/(.*)`)
    );

    await expect(basePage.pageHeader).toHaveText('Template submitted');
  });
}
