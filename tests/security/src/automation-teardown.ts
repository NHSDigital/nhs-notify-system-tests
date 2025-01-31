import { chromium, expect, Page } from "@playwright/test";
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
    cookie: {
      type: "string",
      demandOption: true,
    },
  })
  .parseSync();

const startUrl = `https://${argv.webGatewayEnvironment}.web-gateway.dev.nhsnotify.national.nhs.uk/templates${argv.branchSegment}/manage-templates`;

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await context.setExtraHTTPHeaders({
      Cookie: argv.cookie,
    });

    await page.goto(startUrl, {
      waitUntil: "load",
    });

    await expect(
      page.locator('h1:has-text("Message templates")')
    ).toBeVisible();

    for (let i = 0; i < 10; i++) {
      if ((await deleteTemplate(page)) === false) {
        break;
      }
    }
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

async function deleteTemplate(page: Page) {
  const deleteLink = await page.locator('a:has-text("Delete")').first();

  if (await deleteLink.isVisible()) {
    await deleteLink.click();

    const deleteButton = page.locator(
      'button:has-text("Yes, delete template")'
    );

    await deleteButton.click();

    await page.waitForURL(startUrl);
    await page.waitForTimeout(100)
    await page.reload()
  } else {
    return false;
  }

  return true;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
