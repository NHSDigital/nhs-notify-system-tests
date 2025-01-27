import { chromium } from "@playwright/test";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .options({
    environment: {
      type: "string",
      demandOption: true,
    },
    "email-address": {
      type: "string",
      demandOption: true,
    },
    "temp-password": {
      type: "string",
      demandOption: true,
    },
    "final-password": {
      type: "string",
      demandOption: true,
    },
  })
  .parseSync();

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = `https://${argv.environment}.web-gateway.dev.nhsnotify.national.nhs.uk`;
  const authUrl = `${baseUrl}/auth?redirect=/templates/manage-templates`;
  const loggedInUrl = `${baseUrl}/templates/manage-templates`;

  const requestPromise = page.waitForRequest(
    (request) => request.url() === loggedInUrl
  );

  await page.goto(authUrl, {
    waitUntil: "load",
  });

  const emailInput = page.locator('input[name="username"]');
  const passwordInput = page.locator('input[name="password"]');
  const confirmPasswordInput = page.locator('input[name="confirm_password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.fill(argv.emailAddress);

  await passwordInput.fill(argv.tempPassword);

  await submitButton.click();

  await passwordInput.fill(argv.finalPassword);
  await confirmPasswordInput.fill(argv.finalPassword);

  await submitButton.click();

  const request = await requestPromise;
  const headers = await request.allHeaders();

  await browser.close();

  if (!headers.cookie) {
    throw new Error("cookie is missing");
  }

  console.log(headers.cookie);
}

main().catch((e) => {
  console.error(e);
  process.exit(1)
});
