const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://b2afebdb.palmtong-frontend.pages.dev');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check the exact selector the test uses
  const statsCards = page.locator('.rounded-lg.border.bg-card p');
  const count = await statsCards.count();
  console.log('Count with exact selector:', count);

  // Check what's in the cards
  const cards = page.locator('.rounded-lg.border.bg-card');
  const cardCount = await cards.count();
  console.log('\nTotal cards:', cardCount);

  for (let i = 0; i < Math.min(cardCount, 3); i++) {
    const card = cards.nth(i);
    const text = await card.textContent();
    console.log(`\nCard ${i + 1} text:`, text?.trim().substring(0, 100));

    const pCount = await card.locator('p').count();
    console.log(`Card ${i + 1} has ${pCount} p elements`);
  }

  await browser.close();
})();
