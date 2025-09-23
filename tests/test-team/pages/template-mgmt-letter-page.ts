import { Download, Locator, type Page, expect } from '@playwright/test';
import { TemplateMgmtBasePage } from './template-mgmt-base-page';
import fs from 'fs';
import path from 'path';

export class TemplateMgmtLetterPage extends TemplateMgmtBasePage {
  readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  async selectLetterOption(labelName: string, optionName: string) {
    await this.page.getByLabel(labelName).selectOption(optionName);
  }

  async uploadLetterTemplate(templateName: string) {
    const maxRetries = 30;
    const retryInterval = 2000;
    // await expect(this.page.locator('#letterTemplatePdf')).toBeVisible();
    // await expect(this.page.locator('#letterTemplateCsv')).toBeVisible();

    // await this.page
      // .getByRole('textbox', { name: templateName })
      // .setInputFiles('template.pdf');
    const [fileChooser] = await Promise.all([
    this.page.waitForEvent('filechooser'),
    this.page.getByRole('button', { name: templateName }).click(),
  ]);
    await fileChooser.setFiles('template.pdf');

    await this.page.getByText('Save and upload').click();
    await expect(this.page.getByText('Checking files')).toBeVisible();

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.reload();
        await expect(this.page.getByText('Files uploaded')).toBeVisible({
          timeout: 1000,
        });
        console.log('Success: "Files uploaded" is visible.');
        break;
      } catch (e) {
        console.log(
          `Attempt ${i + 1} failed, retrying in ${retryInterval}ms...`
        );
        await this.page.waitForTimeout(retryInterval);
        if (i === maxRetries - 1) {
          throw new Error(
            '"Files uploaded" was not visible after maximum retries.'
          );
        }
      }
    }
    await expect(this.page.getByText('Request a proof')).toBeVisible({
      timeout: 1000,
    });
  }

  async waitForProofRequest() {
    const maxRetries = 50;
    const retryInterval = 3000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await expect(this.page.getByText('Proof available')).toBeVisible({
          timeout: 1000,
        });
        console.log('Success: "Proof available" is visible.');
        break;
      } catch (e) {
        console.log(
          `Attempt ${i + 1} failed, retrying in ${retryInterval}ms...`
        );
        await this.page.waitForTimeout(retryInterval);
        if (i === maxRetries - 1) {
          throw new Error(
            '"Proof available" was not visible after maximum retries.'
          );
        }
      }
    }
    await expect(
      this.page.locator('a[data-testid^="proof-link_"]').first()
    ).toBeVisible({ timeout: 1000 });
    expect(this.submitTemplateButton.isVisible());
  }

  async verifyFiles() {
    // Wait loop for the link to appear
    const maxRetries = 30;
    const retryInterval = 1000;
    let link: Locator;
    link = this.page.locator('a[data-testid^="proof-link_"]').nth(2);
    for (let i = 0; i < maxRetries; i++) {
      if (await link.isVisible()) {
        break;
      }
      await this.page.waitForTimeout(retryInterval);
      if (i === maxRetries - 1) {
        throw new Error('Proof link did not appear after maximum retries.');
      }
    }

    const [popup, download] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.page.waitForEvent('download'),
      await expect(link).toBeVisible(),
      link.click(),
    ]);

    // Save the file to the downloads directory
    const downloadDir = path.join(__dirname, 'downloads');
    const filename = download.suggestedFilename();
    const filePath = path.join(downloadDir, filename);

    // Create directory if it does not exist
    fs.mkdirSync(downloadDir, { recursive: true });

    await download.saveAs(filePath);

    // Validate the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Download failed: file not found at ${filePath}`);
    }

    // Validate that the downloaded file is a PDF by looking at the file signature
    const fileBuffer = fs.readFileSync(filePath);
    const isPDF = fileBuffer.toString('utf8', 0, 4) === '%PDF';
    if (!isPDF) {
      throw new Error(`Downloaded file is not a valid PDF: ${filePath}`);
    }

    console.log(`PDF downloaded and verified: ${filePath}`);
  }

  async submitLetterTemplate() {
    await this.page.getByTestId('preview-letter-template-cta').click();
    await this.page.getByRole('button', { name: 'Approve and submit' }).click();
    await expect(this.page.locator('#template-submitted')).toBeVisible();
  }
}
