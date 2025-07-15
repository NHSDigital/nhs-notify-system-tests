import { chromium, expect, Page } from '@playwright/test';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .options({
    'web-gateway-environment': {
      type: 'string',
      demandOption: true,
    },
    'email-address': {
      type: 'string',
      demandOption: true,
    },
    'password': {
      type: 'string',
      demandOption: true,
    },
  })
  .parseSync();

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    const base = `https://${argv.webGatewayEnvironment}.web-gateway.dev.nhsnotify.national.nhs.uk`;
    const redirect = `templates/message-templates`;
    const authUrl = `${base}/auth?redirect=/${redirect}`;
    const loggedInUrl = `${base}/${redirect}`;

    const requestPromise = page.waitForRequest(
      (request) => request.url() === loggedInUrl
    );

    await page.goto(authUrl, {
      waitUntil: 'load',
    });

    const emailInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator(
      'button[type="submit"]:has-text("Sign in")'
    );

    await emailInput.fill(argv.emailAddress);
    await passwordInput.fill(argv.password);
    await submitButton.click();

    const request = await requestPromise;
    const headers = await request.allHeaders();

    if (!headers.cookie) {
      throw new Error('cookie is missing');
    }

    expect(page).toHaveURL(loggedInUrl);

    await createTemplate(page, 'sms');

    return headers.cookie;
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

async function createTemplate(page: Page, commType: string) {
  const createTemplateButton = page.locator('a[role="button"]');

  await createTemplateButton.click();

  await page.waitForLoadState('networkidle');

  const commTypeRadio = page.locator(
    `input[id="templateType-${commType.toUpperCase()}"]`
  );
  await commTypeRadio.click();

  const continueButton = page.locator('button[data-testid="submit-button"]');
  await continueButton.click();

  const nameField = page.locator(`input[id="${commType}TemplateName"]`);
  const bodyField = page.locator(`textArea[id="${commType}TemplateMessage"]`);
  await nameField.fill('Template Name');
  await bodyField.fill('Greetings from NHS Notify!');

  const saveButton = page.locator(
    'button[id="create-sms-template-submit-button"]'
  );
  await saveButton.click();

  await page.waitForURL(/preview/);

  await expect(page.locator('text="Template saved"')).toBeVisible();
}

main()
  .then(console.log)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
