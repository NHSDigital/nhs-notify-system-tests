import { Download, type Page, expect } from "@playwright/test";
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
    const maxRetries = 10;
    const retryInterval = 2000;
    await expect(this.page.locator('#letterTemplatePdf')).toBeVisible();
    await expect(this.page.locator('#letterTemplateCsv')).toBeVisible();

    await this.page.getByRole('textbox', { name: templateName }).setInputFiles('template.pdf');
    await this.page.getByText('Save and upload').click();
    await expect(this.page.getByText('Checking files')).toBeVisible();

    for (let i = 0; i < maxRetries; i++) {
    try {
      await this.page.reload();
      await expect(this.page.getByText('Files uploaded')).toBeVisible({ timeout: 1000 });
      console.log('Success: "Files uploaded" is visible.');
      break;
    } catch (e) {
      console.log(`Attempt ${i + 1} failed, retrying in ${retryInterval}ms...`);
      await this.page.waitForTimeout(retryInterval);
      if (i === maxRetries - 1) {
        throw new Error('"Files uploaded" was not visible after maximum retries.');
      }
    }
  }
  await expect(this.page.getByText('Request a proof')).toBeVisible({ timeout: 1000 });
  }

  async waitForProofRequest() {
    const maxRetries = 50;
    const retryInterval = 3000;

    for (let i = 0; i < maxRetries; i++) {
    try {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await expect(this.page.getByText('Proof available')).toBeVisible({ timeout: 1000 });
      console.log('Success: "Proof available" is visible.');
      break;
    } catch (e) {
      console.log(`Attempt ${i + 1} failed, retrying in ${retryInterval}ms...`);
      await this.page.waitForTimeout(retryInterval);
      if (i === maxRetries - 1) {
        throw new Error('"Proof available" was not visible after maximum retries.');
      }
    }
  }
  await expect(this.page.locator('a[data-testid^="proof-link_"]').first()).toBeVisible({ timeout: 1000 });
  expect(this.submitTemplateButton.isVisible());
  }

  async verifyFiles() {
  const downloadDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // Open popup and wait for download events
  const popupPromise = this.page.waitForEvent('popup');
  await this.page.locator('a[data-testid^="proof-link_"]').nth(2).click();

  const popup = await popupPromise;

  const downloads: Download[] = [];

  // Capture downloads
  popup.on('download', (download) => {
    console.log(`Download started: ${download.suggestedFilename()}`);
    downloads.push(download);
  });

  // Wait for popup to close after triggering downloads
  await popup.waitForEvent('close');

  // Save and verify all downloaded files
  const savedFiles: string[] = [];

  for (const download of downloads) {
    const filename = download.suggestedFilename();
    const filePath = path.join(downloadDir, filename);
    await download.saveAs(filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Download failed: file not found at ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const isPDF = fileBuffer.toString('utf8', 0, 4) === '%PDF';
    if (!isPDF) {
      throw new Error(`Downloaded file is not a valid PDF: ${filePath}`);
    }

    savedFiles.push(filename);
    console.log(`Verified PDF: ${filename}`);
  }

  // Wait for all 3 files to appear
  const fileListLocator = this.page.locator('a[data-testid^="proof-link_"] div');
  await expect(fileListLocator).toHaveCount(3, { timeout: 10000 });

  console.log('All 3 files downloaded and listed in the UI');
}

  async submitLetterTemplate() {
    await this.page.getByTestId('preview-letter-template-cta').click();
    await this.page.getByRole('button', { name: 'Approve and submit' }).click();
    await expect(this.page.locator("#template-submitted")).toBeVisible();

  }

}
