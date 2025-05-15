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

  readonly skipLink: Locator;

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
    await this.goBackLink.click();
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

  async selectLetterOption(labelName: string, optionName: string) {
    await this.page.getByLabel(labelName).selectOption(optionName);
  }

  async uploadLetterTemplate(templateName: string) {
    await expect(this.page.locator('#letterTemplatePdf')).toBeVisible();
    await expect(this.page.locator('#letterTemplateCsv')).toBeVisible();

    await this.page.getByRole('textbox', { name: templateName }).setInputFiles('template.pdf');
    await this.page.getByTestId('submit-button').click();
  }

  async logOut() {
    await this.page.locator(`//a[@data-testid='auth-link__link' and text()='Sign out']`).click();
  }
}
