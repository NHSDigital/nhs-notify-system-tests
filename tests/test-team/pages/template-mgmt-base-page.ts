import { Locator, type Page, expect } from "@playwright/test";

export class TemplateMgmtBasePage {
  readonly page: Page;

  readonly notifyBannerLink: Locator;

  readonly loginLink: Locator;

  readonly goBackLink: Locator;

  readonly pageHeader: Locator;

  readonly errorSummary: Locator;

  readonly errorSummaryHeading: Locator;

  readonly errorSummaryList: Locator;

  readonly submitButton: Locator;

  readonly submitTemplateButton: Locator;

  readonly skipLink: Locator;

  readonly templateToDelete: Locator;

  readonly templateEdited: (templateName: string) => Locator;

  constructor(page: Page) {
    this.page = page;

    this.notifyBannerLink = page.locator(
      '[class="nhsuk-header__link nhsuk-header__link--service"]'
    );

    this.loginLink = page.locator(`//a[text()='Sign in']`);

    // Note: doing [class="nhsuk-back-link__link"] will not find the element if it has other class names
    this.goBackLink = page.locator('#maincontent').getByRole('link', { name: 'Back to all templates' });

    this.pageHeader = page.getByRole("heading", { level: 1 });

    this.errorSummary = page.getByRole("alert", { name: "There is a problem" });

    this.errorSummaryHeading = page.getByRole("heading", {
      level: 2,
      name: "There is a problem",
    });

    this.errorSummaryList = this.errorSummary.getByRole("listitem");

    this.submitButton = page.locator('button.nhsuk-button[type="submit"]');

    this.submitTemplateButton = page.getByText("Submit template");

    this.templateToDelete = page.getByRole('link', { name: 'Test delete', exact: true });

    this.templateEdited = (templateName: string) =>
      page.getByRole('link', { name: templateName, exact: true });

    this.skipLink = page
      .locator('[id="skip-link"]')
      .and(page.getByText("Skip to main content"));
  }

  async navigateTo(url: string) {
    await this.page.goto(url);
  }

  async clickNotifyBannerLink() {
    await this.notifyBannerLink.click();
  }

  async clickLoginLink() {
    await this.loginLink.click();
  }

  async noTemplatesAvailable() {
    return await this.page.getByTestId("no-templates-available").isVisible();
  }

  async clickButtonByName(buttonName: string) {
    await this.page.getByRole("button", { name: buttonName }).click();
  }

  async clickLinkByName(linkName: string) {
    await this.page.getByRole("link", { name: linkName, exact: true }).click();
  }

  async clickSubmitButton() {
    await this.submitButton.click();
  }

  async loadPage(_: string) {
    throw new Error("Not implemented");
  }

  async clickBackLink() {
    await this.goBackLink.click({ force: true });
  }

  async waitForLoad() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  async checkStatus(status: string) {
    await expect(this.page.getByText(status)).toBeVisible();
  }

  async fillTextBox(textBoxName: string, textBoxContent: string) {
    await this.page
      .getByRole("textbox", { name: textBoxName })
      .fill(textBoxContent);
  }

  async checkRadio(radioName: string) {
    await this.page.getByRole("radio", { name: radioName }).check();
  }

  async tableRows() {
    const rows = this.page.locator('table tbody tr');
    const rowCount = await rows.count();
    return rowCount;
  }

  async clickFirstTableRowLink() {
    const link = this.page.locator('table:nth-of-type(1) tr:nth-of-type(1) td:nth-of-type(1) a');
    await expect(link).toContainText("COPY");
    await link.click();
  }

  async logOut() {
    await this.page.getByTestId('sign-out-link').click();
  }
}
