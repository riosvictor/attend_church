import { Page } from "puppeteer";

export async function waitLoadURL(page: Page, url: string) {
  let actualUrl = await page.url();

  while (!actualUrl.startsWith(url)) {
    await page.waitForTimeout(1000);
    actualUrl = await page.url();
  }
}