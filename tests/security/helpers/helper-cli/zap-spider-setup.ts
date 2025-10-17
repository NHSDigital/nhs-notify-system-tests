import { chromium, expect } from '@playwright/test';
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

    await expect(page).toHaveURL(loggedInUrl);

    return headers.cookie;
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

main()
  .then(console.log)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
