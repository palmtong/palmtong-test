const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://b2afebdb.palmtong-frontend.pages.dev/customers');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const headers = await page.locator('th').allTextContents();
  console.log('Customer table headers:', JSON.stringify(headers, null, 2));

  const hasThai = headers.some(text => /[\u0E00-\u0E7F]/.test(text));
  console.log('Has Thai:', hasThai);

  await browser.close();
})();
