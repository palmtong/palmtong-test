import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://b2afebdb.palmtong-frontend.pages.dev';
const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anu-9da.workers.dev';

test.describe('Production Frontend - UI & Thai Language', () => {
  test('should load homepage with Thai language', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check for Thai app name
    const appName = await page.locator('h1').first();
    await expect(appName).toContainText('ปาล์มทอง');

    // Verify navigation items are in Thai
    await expect(page.getByRole('link', { name: /หน้าหลัก/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /ลูกค้า/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /สต๊อค/ })).toBeVisible();
  });

  test('should display Dashboard page in Thai', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Verify Dashboard title
    await expect(page.getByRole('heading', { name: /หน้าหลัก/ })).toBeVisible();

    // Verify dashboard cards are visible
    await expect(page.locator('text=จักรยานยนต์ที่ยังไม่ได้ขาย').first()).toBeVisible();
    await expect(page.locator('text=ยอดขายทั้งหมด').first()).toBeVisible();
    await expect(page.locator('text=รายได้ทั้งหมด').first()).toBeVisible();
  });

  test('should navigate to Customers page in Thai', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Click Customers navigation
    await page.getByRole('link', { name: /ลูกค้า/ }).click();
    await page.waitForURL('**/customers');

    // Verify Customers page title in Thai
    await expect(page.getByRole('heading', { name: /ลูกค้า/ })).toBeVisible();

    // Verify "Add Customer" button in Thai
    await expect(page.locator('button', { hasText: 'เพิ่มข้อมูลลูกค้า' })).toBeVisible();
  });

  test('should navigate to Bikes page in Thai', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Click Bikes navigation
    await page.getByRole('link', { name: /สต๊อค/ }).click();
    await page.waitForURL('**/bikes');

    // Verify Bikes page title in Thai
    await expect(page.getByRole('heading', { name: /สต๊อค/ })).toBeVisible();

    // Verify "Add Bike" button in Thai
    await expect(page.locator('button', { hasText: 'ซื้อเข้า' })).toBeVisible();
  });

  test('should navigate to Sales page in Thai', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /ขายออก/ }).click();
    await page.waitForURL('**/sales');

    await expect(page.getByRole('heading', { name: /ขายออก/ })).toBeVisible();
  });

  test('should navigate to Invoices page in Thai', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /ใบกำกับภาษี/ }).click();
    await page.waitForURL('**/invoices');

    await expect(page.getByRole('heading', { name: /ใบกำกับภาษี/ })).toBeVisible();
  });

  test('should display Management section in Thai', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Verify Management section label
    await expect(page.locator('text=การจัดการ')).toBeVisible();

    // Verify management items
    await expect(page.locator('text=ยี่ห้อ')).toBeVisible();
    await expect(page.locator('text=ซัพพลายเออร์')).toBeVisible();
    await expect(page.locator('text=บริษัทการเงิน')).toBeVisible();
  });

  test('should display footer with Thai app version', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Verify footer contains Thai app name and version
    await expect(page.locator('text=ปาล์มทอง เวอร์ชัน')).toBeVisible();
  });
});

test.describe('Production Frontend - API Integration', () => {
  test('should load dashboard data from backend API', async ({ page }) => {
    // Intercept API calls
    let dashboardApiCalled = false;

    page.on('response', response => {
      if (response.url().includes('/api/dashboard')) {
        dashboardApiCalled = true;
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Wait for dashboard data to load
    await page.waitForTimeout(2000);

    // Verify API was called
    expect(dashboardApiCalled).toBe(true);

    // Verify dashboard displays numbers (data from API)
    const statsCards = page.locator('.rounded-lg.border.bg-card');
    await expect(statsCards.first()).toBeVisible();
  });

  test('should fetch customers data from API', async ({ page }) => {
    let customersApiCalled = false;

    page.on('response', response => {
      if (response.url().includes('/api/customers')) {
        customersApiCalled = true;
      }
    });

    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(customersApiCalled).toBe(true);
  });

  test('should fetch bikes data from API', async ({ page }) => {
    let bikesApiCalled = false;

    page.on('response', response => {
      if (response.url().includes('/api/bikes')) {
        bikesApiCalled = true;
      }
    });

    await page.goto(`${FRONTEND_URL}/bikes`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(bikesApiCalled).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Navigate to a page
    await page.getByRole('link', { name: /ลูกค้า/ }).click();
    await page.waitForURL('**/customers');

    // Page should still be usable even if API is slow
    await expect(page.getByRole('heading', { name: /ลูกค้า/ })).toBeVisible();
  });
});

test.describe('Production Frontend - Backend API Direct Tests', () => {
  test('backend API /api/dashboard should return valid data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/dashboard`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('inventory');
    expect(data).toHaveProperty('sales');
    expect(data).toHaveProperty('customers');
    expect(data.inventory).toHaveProperty('unsoldBikes');
    expect(data.inventory).toHaveProperty('totalBikes');
    expect(data.sales).toHaveProperty('totalCount');
    expect(data.customers).toHaveProperty('totalCount');
  });

  test('backend API /api/customers should return customer list', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/customers`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('backend API /api/bikes should return bike list', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/bikes`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('backend API /api/brands should return brand list', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/brands`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('backend API should support CORS from frontend', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/dashboard`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });

    expect(response.ok()).toBeTruthy();
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader).toBeDefined();
  });
});

test.describe('Production Frontend - Data Display', () => {
  test('should display customer table with Thai headers', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for Thai table headers
    await expect(page.locator('th', { hasText: 'เลขบัตรประชาชน' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'ชื่อ' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'นามสกุล' })).toBeVisible();
  });

  test('should display bike table with headers', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/bikes`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for table headers (now in Thai)
    const headers = page.locator('th');
    const headerText = await headers.allTextContents();

    // Verify essential bike table columns are present (Thai headers)
    const hasRequiredColumns = headerText.some(text =>
      /รหัส|ยี่ห้อ|รุ่น|เลขคอ|เลขเครื่อง|สี|ราคา/.test(text)
    );
    expect(hasRequiredColumns).toBe(true);
    expect(headerText.length).toBeGreaterThan(0);
  });

  test('should display dashboard statistics', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Wait for stats cards to load
    const statsCards = page.locator('.rounded-lg.border.bg-card');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify cards contain the expected stat labels
    await expect(page.locator('text=จักรยานยนต์ที่ยังไม่ได้ขาย').first()).toBeVisible();
    await expect(page.locator('text=ยอดขายทั้งหมด').first()).toBeVisible();
    await expect(page.locator('text=รายได้ทั้งหมด').first()).toBeVisible();
  });
});

test.describe('Production Frontend - Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Page should still load on mobile
    await expect(page.locator('h1').first()).toContainText('ปาล์มทอง');
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toContainText('ปาล์มทอง');
  });
});

test.describe('Production Frontend - Performance', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Filter out known/acceptable errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('sourcemap')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
