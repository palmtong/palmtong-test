const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('response', (response) => {
    if (!response.ok()) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  await page.goto('https://a1c71a40.palmtong-frontend.pages.dev');
  await page.waitForLoadState('networkidle');

  console.log('\n=== Console Errors ===');
  if (errors.length === 0) {
    console.log('No console errors found!');
  } else {
    errors.forEach((error, index) => {
      console.log(`\n[Error ${index + 1}]`);
      console.log(error);
    });
  }

  console.log('\n=== Failed HTTP Requests ===');
  if (failedRequests.length === 0) {
    console.log('No failed requests!');
  } else {
    failedRequests.forEach((req, index) => {
      console.log(`\n[Request ${index + 1}]`);
      console.log(`URL: ${req.url}`);
      console.log(`Status: ${req.status} ${req.statusText}`);
    });
  }

  await browser.close();
})();
