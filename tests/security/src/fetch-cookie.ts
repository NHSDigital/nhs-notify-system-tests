import { chromium } from "@playwright/test";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .options({
    "web-gateway-environment": {
      type: "string",
      demandOption: true,
    },
    "branch-segment": {
      type: "string",
      default: "",
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

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    const base = `https://${argv.webGatewayEnvironment}.web-gateway.dev.nhsnotify.national.nhs.uk`;
    const redirect = `templates${argv.branchSegment}/manage-templates`;
    const authUrl = `${base}/auth?redirect=/${redirect}`;
    const loggedInUrl = `${base}/${redirect}`;

    const requestPromise = page.waitForRequest(
      (request) => request.url() === loggedInUrl
    );

    await page.goto(authUrl, {
      waitUntil: "load",
    });

    const emailInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');
    const confirmPasswordInput = page.locator('input[name="confirm_password"]');
    const submitButton = page.locator(
      'button[type="submit"]:has-text("Sign in")'
    );
    const submitChangePassword = page.locator(
      'button[type="submit"]:has-text("Change Password")'
    );

    await emailInput.fill(argv.emailAddress);

    await passwordInput.fill(argv.tempPassword);

    await submitButton.click();

    await passwordInput.fill(argv.finalPassword);
    await confirmPasswordInput.fill(argv.finalPassword);

    await submitChangePassword.click();

    const request = await requestPromise;
    const headers = await request.allHeaders();

    if (!headers.cookie) {
      throw new Error("cookie is missing");
    }

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
