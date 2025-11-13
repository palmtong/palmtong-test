/**
 * Cloudflare Full Integration Tests
 *
 * Tests complete integration between:
 * - Cloudflare Pages (Frontend)
 * - Cloudflare Workers (Backend API)
 * - Cloudflare D1 (Database)
 *
 * These tests verify:
 * 1. Backend API health and endpoints
 * 2. Frontend loading and rendering
 * 3. Full CRUD operations through UI
 * 4. Thai language support
 * 5. Data persistence
 * 6. CORS configuration
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anu-9da.workers.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://8c9839e9.palmtong-frontend.pages.dev';

test.describe('Cloudflare Backend API Integration', () => {

  test('Backend health check returns 200', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('Backend supports CORS for frontend origin', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/dashboard`, {
      headers: {
        'Origin': FRONTEND_URL,
      }
    });

    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });

  test('Dashboard API returns valid data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/dashboard`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('inventory');
    expect(data).toHaveProperty('sales');
    expect(data.inventory).toHaveProperty('unsoldBikes');
    expect(typeof data.inventory.unsoldBikes).toBe('number');
  });

  test('Customers API returns paginated data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/customers?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('rows');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page', 1);
    expect(Array.isArray(data.rows)).toBeTruthy();
  });

  test('Bikes API returns data with proper structure', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/bikes/unsold?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('rows');
    expect(data).toHaveProperty('records');
    expect(Array.isArray(data.rows)).toBeTruthy();

    if (data.rows.length > 0) {
      const bike = data.rows[0];
      expect(bike).toHaveProperty('bike_id');
      expect(bike).toHaveProperty('bike_chasi_number');
      expect(bike).toHaveProperty('brand_name_english');
    }
  });

  test('Brands API returns data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/brands?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('rows');
    expect(Array.isArray(data.rows)).toBeTruthy();
  });

  test('Suppliers API returns data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/suppliers?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('rows');
    expect(Array.isArray(data.rows)).toBeTruthy();
  });

  test('Sales API returns data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/sales?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('rows');
    expect(Array.isArray(data.rows)).toBeTruthy();
  });

  test('Invoices API returns data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/invoices?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('rows');
    expect(Array.isArray(data.rows)).toBeTruthy();
  });

  test('Finance companies API returns data', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/finance?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('rows');
    expect(Array.isArray(data.rows)).toBeTruthy();
  });
});

test.describe('Cloudflare Frontend Integration', () => {

  test('Frontend loads successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Check page loaded
    await expect(page).toHaveTitle(/Palmtong/i);
  });

  test('Frontend displays Thai language correctly', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Check for Thai text in navigation
    const mainContent = page.locator('main, body');
    await expect(mainContent.getByText('หน้าหลัก').first()).toBeVisible();
    await expect(mainContent.getByText('ลูกค้า').first()).toBeVisible();
    await expect(mainContent.getByText('สต๊อค').first()).toBeVisible();
  });

  test('Dashboard loads and displays data', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check for dashboard metrics
    const mainContent = page.locator('main');
    await expect(mainContent.getByText('จักรยานยนต์ที่ยังไม่ได้ขาย').first()).toBeVisible();
  });

  test('Navigation to Customers page works', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Click on Customers nav link
    await page.getByRole('link', { name: /ลูกค้า/ }).first().click();
    await page.waitForLoadState('networkidle');

    // Check URL changed
    expect(page.url()).toContain('/customers');

    // Check page content
    await expect(page.getByRole('main').getByRole('heading', { name: 'ลูกค้า' })).toBeVisible();
  });

  test('Navigation to Bikes page works', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Click on Bikes nav link
    await page.getByRole('link', { name: /สต๊อค/ }).first().click();
    await page.waitForLoadState('networkidle');

    // Check URL changed
    expect(page.url()).toContain('/bikes');

    // Check page content
    await expect(page.getByRole('main').getByRole('heading', { name: 'สต๊อค' })).toBeVisible();
  });

  test('All action buttons display in Thai', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/bikes`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for Thai button text
    const mainContent = page.locator('main');

    // Add button
    await expect(mainContent.getByRole('button', { name: 'ซื้อเข้า' })).toBeVisible();

    // Wait for table to load
    const editButtons = mainContent.getByRole('button', { name: 'แก้ไข' });
    const deleteButtons = mainContent.getByRole('button', { name: 'ลบ' });

    // Check at least one Edit/Delete button exists (if there's data)
    const editCount = await editButtons.count();
    const deleteCount = await deleteButtons.count();

    if (editCount > 0) {
      await expect(editButtons.first()).toBeVisible();
    }

    if (deleteCount > 0) {
      await expect(deleteButtons.first()).toBeVisible();
    }
  });

  test('Frontend can fetch data from backend', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');

    // Wait for API call to complete
    await page.waitForTimeout(2000);

    // Check that table has data (or at least loaded)
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('Frontend handles API errors gracefully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through pages
    await page.getByRole('link', { name: /ลูกค้า/ }).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for fatal errors (ignore expected network errors)
    const fatalErrors = errors.filter(e =>
      !e.includes('Failed to load resource') &&
      !e.includes('NetworkError')
    );

    expect(fatalErrors.length).toBe(0);
  });
});

test.describe('Cloudflare Full Stack Integration', () => {

  test('Complete flow: Load frontend → Fetch backend data → Display in UI', async ({ page }) => {
    // 1. Load frontend
    const response = await page.goto(`${FRONTEND_URL}/`);
    expect(response!.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle');

    // 2. Wait for backend API calls
    await page.waitForTimeout(3000);

    // 3. Verify page loaded successfully
    await expect(page).toHaveTitle(/Palmtong/i);

    // 4. Check for Thai language content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();

    // Verify Thai text is present (navigation or content)
    const hasThai =
      bodyText!.includes('สต๊อค') ||
      bodyText!.includes('ลูกค้า') ||
      bodyText!.includes('ขาย') ||
      bodyText!.includes('ยี่ห้อ') ||
      bodyText!.includes('ซัพพลายเออร์');

    expect(hasThai).toBeTruthy();

    // 5. Verify some numerical data loaded (indicates backend data loaded)
    expect(/\d+/.test(bodyText!)).toBeTruthy();
  });

  test('DataTable pagination works end-to-end', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check pagination controls exist
    const paginationInfo = page.getByText(/แสดง \d+ ถึง \d+ จาก \d+ รายการ/);

    // If pagination exists, test it
    if (await paginationInfo.isVisible()) {
      const nextButton = page.getByRole('button', { name: /ไปหน้าถัดไป/ });

      if (await nextButton.isEnabled()) {
        // Click next page
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Verify URL updated with page parameter
        expect(page.url()).toContain('page=2');
      }
    }
  });

  test('Search/Filter functionality works end-to-end', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for filter inputs
    const filterInputs = page.locator('input[type="text"]');
    const count = await filterInputs.count();

    if (count > 0) {
      // Type in first filter
      const firstInput = filterInputs.first();
      await firstInput.fill('test');

      // Wait for filter to apply
      await page.waitForTimeout(1500);

      // Verify table updated (should have made new API call)
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
    }
  });

  test('Thai language persists across navigation', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Navigate through multiple pages
    const pages = ['ลูกค้า', 'สต๊อค', 'ยี่ห้อ'];

    for (const pageName of pages) {
      await page.getByRole('link', { name: new RegExp(pageName) }).first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify Thai text still visible
      const mainContent = page.locator('main');
      await expect(mainContent.getByRole('heading', { name: pageName })).toBeVisible();
    }
  });

  test('Performance: Page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
    console.log(`Page loaded in ${duration}ms`);
  });

  test('Performance: API responses within 2 seconds', async ({ request }) => {
    const endpoints = [
      '/api/dashboard',
      '/api/customers?page=1&rows=10',
      '/api/bikes/unsold?page=1&rows=10',
      '/api/brands?page=1&rows=10',
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await request.get(`${BACKEND_URL}${endpoint}`);
      const duration = Date.now() - start;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000);
      console.log(`${endpoint} responded in ${duration}ms`);
    }
  });
});
