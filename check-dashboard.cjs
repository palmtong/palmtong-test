const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://b2afebdb.palmtong-frontend.pages.dev');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check for various possible selectors
  console.log('Cards with .rounded-lg.border.bg-card:', await page.locator('.rounded-lg.border.bg-card').count());
  console.log('All cards:', await page.locator('[class*="card"]').count());
  console.log('All p elements:', await page.locator('p').count());

  // Try to find stat cards by looking for number patterns
  const allText = await page.locator('body').textContent();
  console.log('\nPage contains "จักรยานยนต์":', allText.includes('จักรยานยนต์'));
  console.log('Page contains "ยอดขาย":', allText.includes('ยอดขาย'));

  // Check for any divs with stat-like content
  const statElements = await page.locator('div:has-text("จักรยานยนต์")').count();
  console.log('\nDivs with bike text:', statElements);

  await browser.close();
})();
