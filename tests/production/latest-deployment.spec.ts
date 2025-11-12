import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://df24ca93.palmtong-frontend.pages.dev';
const BACKEND_URL = 'https://palmtong-backend.anu-9da.workers.dev';

test.describe('Latest Deployment - Thai Language & API', () => {
  test('Homepage should display Thai language', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const appName = await page.locator('h1').first();
    await expect(appName).toContainText('ปาล์มทอง');
  });

  test('Dashboard should load with Thai text and API data', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check Thai title in main content area (not sidebar)
    await expect(page.getByRole('main').getByRole('heading', { name: 'หน้าหลัก' })).toBeVisible();

    // Check dashboard stats loaded from API
    await expect(page.getByText('จักรยานยนต์ที่ยังไม่ได้ขาย').first()).toBeVisible();
    await expect(page.getByText('ยอดขายทั้งหมด').first()).toBeVisible();
  });

  test('All navigation items should be in Thai', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Check specific navigation links in sidebar
    await expect(page.getByRole('link', { name: /ลูกค้า/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /สต๊อค/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /ขายออก/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /ใบกำกับภาษี/ })).toBeVisible();
    await expect(page.getByText('การจัดการ').first()).toBeVisible();
  });

  test('Backend API /api/dashboard returns valid data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/dashboard`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('inventory');
    expect(data).toHaveProperty('sales');
    expect(data.inventory.unsoldBikes).toBeGreaterThan(0);
    expect(data.customers.totalCount).toBeGreaterThan(0);
  });

  test('Customers page should show Thai headers and API data', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check Thai title in main content
    await expect(page.getByRole('main').getByRole('heading', { name: 'ลูกค้า' })).toBeVisible();

    // Check Thai table headers - use text locator for th elements
    await expect(page.locator('th:has-text("เลขบัตรประชาชน")')).toBeVisible();
    await expect(page.locator('th:has-text("ชื่อ")')).toBeVisible();
  });

  test('Bikes page should show Thai headers', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/bikes`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check Thai title in main content
    await expect(page.getByRole('main').getByRole('heading', { name: 'สต๊อค' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ซื้อเข้า' })).toBeVisible();
  });

  test('API integration works with CORS', async ({ request }) => {
    const endpoints = ['/api/customers', '/api/bikes', '/api/brands', '/api/sales'];

    for (const endpoint of endpoints) {
      const response = await request.get(`${BACKEND_URL}${endpoint}`, {
        headers: { 'Origin': FRONTEND_URL }
      });
      expect(response.ok()).toBeTruthy();
    }
  });

  test('Performance - loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });
});
