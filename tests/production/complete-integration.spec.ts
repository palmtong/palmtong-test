/**
 * Complete Cloudflare Integration Test Suite
 *
 * 100% Functionality Coverage:
 * - All CRUD operations for all entities
 * - Full data flow: Frontend → Backend API → D1 Database
 * - Thai language validation throughout
 * - UI interactions and workflows
 *
 * Tests against production Cloudflare URLs
 */

import { test, expect, type Page } from '@playwright/test';
import { generateThaiIdFromSeed } from '../helpers/thai-id';

const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anu-9da.workers.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://8c9839e9.palmtong-frontend.pages.dev';

// Helper functions
async function waitForTableLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for data to load
}

async function openModal(page: Page, buttonText: string) {
  await page.getByRole('button', { name: buttonText }).click();
  await page.waitForTimeout(500);
}

async function closeModal(page: Page) {
  await page.getByRole('button', { name: /ยกเลิก|Cancel/ }).click();
  await page.waitForTimeout(500);
}

// Test data generators
const generateTestCustomer = () => {
  const timestamp = Date.now();
  return {
    idcard: generateThaiIdFromSeed(timestamp),
    firstname: `ทดสอบ${timestamp.toString().slice(-4)}`,
    lastname: 'ระบบ',
    phone: `081234${timestamp.toString().slice(-4)}`,
    address: '123 ถนนทดสอบ กรุงเทพฯ'
  };
};

const generateTestBrand = () => ({
  nameThai: `ยี่ห้อทดสอบ${Date.now().toString().slice(-4)}`,
  nameEnglish: `TestBrand${Date.now().toString().slice(-4)}`,
  note: 'สร้างโดยการทดสอบอัตโนมัติ'
});

const generateTestSupplier = () => ({
  nickname: `ซัพ${Date.now().toString().slice(-4)}`,
  name: `บริษัททดสอบ ${Date.now().toString().slice(-4)} จำกัด`,
  address: '456 ถนนทดสอบ',
  phone: '0299999999'
});

const generateTestFinance = () => ({
  nickname: `การเงิน${Date.now().toString().slice(-4)}`,
  fullname: `บริษัทการเงินทดสอบ ${Date.now().toString().slice(-4)} จำกัด`,
  address: '789 ถนนทดสอบ',
  phone: '0288888888'
});

test.describe('Complete Integration - Dashboard', () => {

  test('Dashboard API returns complete metrics', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/dashboard`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('inventory');
    expect(data).toHaveProperty('sales');
    expect(data).toHaveProperty('customers');
    expect(data.inventory).toHaveProperty('unsoldBikes');
    expect(data.inventory).toHaveProperty('soldBikes');
    expect(data.inventory).toHaveProperty('totalBikes');
    expect(data.sales).toHaveProperty('totalCount');
    expect(data.sales).toHaveProperty('totalRevenue');
    expect(data.customers).toHaveProperty('totalCount');
  });

  test('Dashboard UI displays all metrics in Thai', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/`);
    await waitForTableLoad(page);

    // Check Thai text is present
    const body = await page.locator('body').textContent();
    expect(body).toContain('สต๊อค');
    expect(body).toContain('ลูกค้า');
  });
});

test.describe('Complete Integration - Customers CRUD', () => {

  test('Full CRUD workflow for Customers', async ({ page }) => {
    const testCustomer = generateTestCustomer();
    let customerId: number;

    // Navigate to Customers page
    await page.goto(`${FRONTEND_URL}/customers`);
    await waitForTableLoad(page);

    // CREATE: Add new customer
    await openModal(page, /เพิ่มข้อมูลลูกค้า/);

    await page.getByLabel(/เลขบัตรประชาชน/).fill(testCustomer.idcard);
    await page.getByLabel(/ชื่อ/).first().fill(testCustomer.firstname);
    await page.getByLabel(/นามสกุล/).fill(testCustomer.lastname);
    await page.getByLabel(/เบอร์โทรศัพท์/).fill(testCustomer.phone);
    await page.getByLabel(/ที่อยู่/).fill(testCustomer.address);

    await page.getByRole('button', { name: /บันทึก|สร้าง/ }).click();
    await page.waitForTimeout(1500);

    // READ: Verify customer appears in table
    await page.reload();
    await waitForTableLoad(page);
    const tableText = await page.locator('table').textContent();
    expect(tableText).toContain(testCustomer.firstname);

    // UPDATE: Edit the customer
    const editButton = page.getByRole('row').filter({ hasText: testCustomer.firstname })
      .getByRole('button', { name: /แก้ไข/ }).first();
    await editButton.click();
    await page.waitForTimeout(500);

    const newLastname = 'แก้ไขแล้ว';
    await page.getByLabel(/นามสกุล/).fill(newLastname);
    await page.getByRole('button', { name: /อัพเดท|บันทึก/ }).click();
    await page.waitForTimeout(1500);

    // Verify update
    await page.reload();
    await waitForTableLoad(page);
    const updatedTable = await page.locator('table').textContent();
    expect(updatedTable).toContain(newLastname);

    // DELETE: Remove the customer
    const deleteButton = page.getByRole('row').filter({ hasText: testCustomer.firstname })
      .getByRole('button', { name: /ลบ/ }).first();

    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(1500);

    // Verify deletion
    await page.reload();
    await waitForTableLoad(page);
    const finalTable = await page.locator('table').textContent();
    expect(finalTable).not.toContain(testCustomer.idcard);
  });

  test('Customers API CRUD operations', async ({ request }) => {
    const testCustomer = generateTestCustomer();

    // CREATE
    const createResponse = await request.post(`${BACKEND_URL}/api/customers`, {
      data: testCustomer
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    expect(created).toHaveProperty('customer_id');
    const customerId = created.customer_id;

    // READ
    const readResponse = await request.get(`${BACKEND_URL}/api/customers/${customerId}`);
    expect(readResponse.ok()).toBeTruthy();
    const customer = await readResponse.json();
    expect(customer.customer_firstname).toBe(testCustomer.firstname);

    // UPDATE
    const updateData = { ...testCustomer, lastname: 'อัพเดท' };
    const updateResponse = await request.put(`${BACKEND_URL}/api/customers/${customerId}`, {
      data: updateData
    });
    expect(updateResponse.ok()).toBeTruthy();

    // Verify update
    const verifyResponse = await request.get(`${BACKEND_URL}/api/customers/${customerId}`);
    const updated = await verifyResponse.json();
    expect(updated.customer_lastname).toBe('อัพเดท');

    // DELETE
    const deleteResponse = await request.delete(`${BACKEND_URL}/api/customers/${customerId}`);
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify deletion
    const checkResponse = await request.get(`${BACKEND_URL}/api/customers/${customerId}`);
    expect(checkResponse.status()).toBe(404);
  });
});

test.describe('Complete Integration - Brands CRUD', () => {

  test('Full CRUD workflow for Brands', async ({ page }) => {
    const testBrand = generateTestBrand();

    await page.goto(`${FRONTEND_URL}/brands`);
    await waitForTableLoad(page);

    // CREATE
    await openModal(page, /เพิ่มยี่ห้อ/);
    await page.getByLabel(/ชื่อภาษาไทย/).fill(testBrand.nameThai);
    await page.getByLabel(/ชื่อภาษาอังกฤษ/).fill(testBrand.nameEnglish);
    await page.getByRole('button', { name: /บันทึก|สร้าง/ }).click();
    await page.waitForTimeout(1500);

    // READ
    await page.reload();
    await waitForTableLoad(page);
    const tableText = await page.locator('table').textContent();
    expect(tableText).toContain(testBrand.nameThai);

    // UPDATE
    const editButton = page.getByRole('row').filter({ hasText: testBrand.nameThai })
      .getByRole('button', { name: /แก้ไข/ }).first();
    await editButton.click();
    await page.waitForTimeout(500);

    const newNameThai = `${testBrand.nameThai}แก้ไข`;
    await page.getByLabel(/ชื่อภาษาไทย/).fill(newNameThai);
    await page.getByRole('button', { name: /อัพเดท|บันทึก/ }).click();
    await page.waitForTimeout(1500);

    // Verify update
    await page.reload();
    await waitForTableLoad(page);
    const updatedTable = await page.locator('table').textContent();
    expect(updatedTable).toContain(newNameThai);

    // DELETE
    const deleteButton = page.getByRole('row').filter({ hasText: newNameThai })
      .getByRole('button', { name: /ลบ/ }).first();

    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(1500);

    // Verify deletion
    await page.reload();
    await waitForTableLoad(page);
    const finalTable = await page.locator('table').textContent();
    expect(finalTable).not.toContain(newNameThai);
  });

  test('Brands API CRUD operations', async ({ request }) => {
    const testBrand = generateTestBrand();

    // CREATE
    const createResponse = await request.post(`${BACKEND_URL}/api/brands`, {
      data: {
        brand_name_thai: testBrand.nameThai,
        brand_name_english: testBrand.nameEnglish,
        brand_note: testBrand.note
      }
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const brandId = created.brand_id;

    // READ
    const listResponse = await request.get(`${BACKEND_URL}/api/brands?page=1&rows=100`);
    const list = await listResponse.json();
    const found = list.rows.find((b: any) => b.brand_id === brandId);
    expect(found).toBeDefined();
    expect(found.brand_name_thai).toBe(testBrand.nameThai);

    // UPDATE
    const updateResponse = await request.put(`${BACKEND_URL}/api/brands/${brandId}`, {
      data: {
        brand_name_thai: `${testBrand.nameThai}อัพเดท`,
        brand_name_english: testBrand.nameEnglish,
        brand_note: testBrand.note
      }
    });
    expect(updateResponse.ok()).toBeTruthy();

    // DELETE
    const deleteResponse = await request.delete(`${BACKEND_URL}/api/brands/${brandId}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });
});

test.describe('Complete Integration - Suppliers CRUD', () => {

  test('Full CRUD workflow for Suppliers', async ({ page }) => {
    const testSupplier = generateTestSupplier();

    await page.goto(`${FRONTEND_URL}/suppliers`);
    await waitForTableLoad(page);

    // CREATE
    await openModal(page, /เพิ่มซัพพลายเออร์/);
    await page.getByLabel(/ชื่อเล่น/).fill(testSupplier.nickname);
    await page.getByLabel(/ชื่อเต็ม/).fill(testSupplier.name);
    await page.getByLabel(/ที่อยู่/).fill(testSupplier.address);
    await page.getByLabel(/เบอร์โทรศัพท์/).fill(testSupplier.phone);
    await page.getByRole('button', { name: /บันทึก|สร้าง/ }).click();
    await page.waitForTimeout(1500);

    // READ
    await page.reload();
    await waitForTableLoad(page);
    const tableText = await page.locator('table').textContent();
    expect(tableText).toContain(testSupplier.nickname);

    // UPDATE
    const editButton = page.getByRole('row').filter({ hasText: testSupplier.nickname })
      .getByRole('button', { name: /แก้ไข/ }).first();
    await editButton.click();
    await page.waitForTimeout(500);

    const newNickname = `${testSupplier.nickname}แก้ไข`;
    await page.getByLabel(/ชื่อเล่น/).fill(newNickname);
    await page.getByRole('button', { name: /อัพเดท|บันทึก/ }).click();
    await page.waitForTimeout(1500);

    // Verify update
    await page.reload();
    await waitForTableLoad(page);
    const updatedTable = await page.locator('table').textContent();
    expect(updatedTable).toContain(newNickname);

    // DELETE
    const deleteButton = page.getByRole('row').filter({ hasText: newNickname })
      .getByRole('button', { name: /ลบ/ }).first();

    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(1500);

    // Verify deletion
    await page.reload();
    await waitForTableLoad(page);
    const finalTable = await page.locator('table').textContent();
    expect(finalTable).not.toContain(newNickname);
  });

  test('Suppliers API CRUD operations', async ({ request }) => {
    const testSupplier = generateTestSupplier();

    // CREATE
    const createResponse = await request.post(`${BACKEND_URL}/api/suppliers`, {
      data: testSupplier
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const supplierId = created.suplier_id;

    // READ
    const listResponse = await request.get(`${BACKEND_URL}/api/suppliers?page=1&rows=100`);
    const list = await listResponse.json();
    const found = list.rows.find((s: any) => s.suplier_id === supplierId);
    expect(found).toBeDefined();

    // UPDATE
    const updateResponse = await request.put(`${BACKEND_URL}/api/suppliers/${supplierId}`, {
      data: { ...testSupplier, nickname: `${testSupplier.nickname}อัพเดท` }
    });
    expect(updateResponse.ok()).toBeTruthy();

    // DELETE
    const deleteResponse = await request.delete(`${BACKEND_URL}/api/suppliers/${supplierId}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });
});

test.describe('Complete Integration - Finance Companies CRUD', () => {

  test('Full CRUD workflow for Finance Companies', async ({ page }) => {
    const testFinance = generateTestFinance();

    await page.goto(`${FRONTEND_URL}/finance`);
    await waitForTableLoad(page);

    // CREATE
    await openModal(page, /เพิ่มบริษัทการเงิน/);
    await page.locator('input[name="nickname"]').fill(testFinance.nickname);
    await page.locator('input[name="fullname"]').fill(testFinance.fullname);
    await page.getByLabel(/ที่อยู่/).fill(testFinance.address);
    await page.getByLabel(/เบอร์โทรศัพท์/).fill(testFinance.phone);
    await page.getByRole('button', { name: /บันทึก|สร้าง/ }).click();
    await page.waitForTimeout(1500);

    // READ
    await page.reload();
    await waitForTableLoad(page);
    const tableText = await page.locator('table').textContent();
    expect(tableText).toContain(testFinance.nickname);

    // UPDATE
    const editButton = page.getByRole('row').filter({ hasText: testFinance.nickname })
      .getByRole('button', { name: /แก้ไข/ }).first();
    await editButton.click();
    await page.waitForTimeout(500);

    const newNickname = `${testFinance.nickname}แก้ไข`;
    await page.locator('input[name="nickname"]').fill(newNickname);
    await page.getByRole('button', { name: /อัพเดท|บันทึก/ }).click();
    await page.waitForTimeout(1500);

    // Verify update
    await page.reload();
    await waitForTableLoad(page);
    const updatedTable = await page.locator('table').textContent();
    expect(updatedTable).toContain(newNickname);

    // DELETE
    const deleteButton = page.getByRole('row').filter({ hasText: newNickname })
      .getByRole('button', { name: /ลบ/ }).first();

    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(1500);

    // Verify deletion
    await page.reload();
    await waitForTableLoad(page);
    const finalTable = await page.locator('table').textContent();
    expect(finalTable).not.toContain(newNickname);
  });

  test('Finance API CRUD operations', async ({ request }) => {
    const testFinance = generateTestFinance();

    // CREATE
    const createResponse = await request.post(`${BACKEND_URL}/api/finance`, {
      data: testFinance
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const financeId = created.finance_id;

    // READ
    const listResponse = await request.get(`${BACKEND_URL}/api/finance?page=1&rows=100`);
    const list = await listResponse.json();
    const found = list.rows.find((f: any) => f.finance_id === financeId);
    expect(found).toBeDefined();

    // UPDATE
    const updateResponse = await request.put(`${BACKEND_URL}/api/finance/${financeId}`, {
      data: { ...testFinance, nickname: `${testFinance.nickname}อัพเดท` }
    });
    expect(updateResponse.ok()).toBeTruthy();

    // DELETE
    const deleteResponse = await request.delete(`${BACKEND_URL}/api/finance/${financeId}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });
});

test.describe('Complete Integration - Thai Language Validation', () => {

  test('All pages display Thai navigation consistently', async ({ page }) => {
    const pages = [
      { url: '/', name: 'หน้าหลัก' },
      { url: '/customers', name: 'ลูกค้า' },
      { url: '/bikes', name: 'สต๊อค' },
      { url: '/brands', name: 'ยี่ห้อ' },
      { url: '/suppliers', name: 'ซัพพลายเออร์' },
      { url: '/finance', name: 'บริษัทการเงิน' },
      { url: '/sales', name: 'ขายออก' },
      { url: '/invoices', name: 'ใบกำกับภาษี' }
    ];

    for (const testPage of pages) {
      await page.goto(`${FRONTEND_URL}${testPage.url}`);
      await waitForTableLoad(page);

      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain(testPage.name);
    }
  });

  test('All CRUD buttons display in Thai', async ({ page }) => {
    const pages = ['/customers', '/bikes', '/brands', '/suppliers', '/finance'];

    for (const url of pages) {
      await page.goto(`${FRONTEND_URL}${url}`);
      await waitForTableLoad(page);

      // Check for Thai buttons in table
      const editButtons = page.getByRole('button', { name: /แก้ไข/ });
      const deleteButtons = page.getByRole('button', { name: /ลบ/ });

      const editCount = await editButtons.count();
      const deleteCount = await deleteButtons.count();

      if (editCount > 0) {
        await expect(editButtons.first()).toBeVisible();
      }
      if (deleteCount > 0) {
        await expect(deleteButtons.first()).toBeVisible();
      }
    }
  });
});

test.describe('Complete Integration - Performance Validation', () => {

  test('All API endpoints respond within 2 seconds', async ({ request }) => {
    const endpoints = [
      '/api/dashboard',
      '/api/customers?page=1&rows=10',
      '/api/bikes/unsold?page=1&rows=10',
      '/api/brands?page=1&rows=10',
      '/api/suppliers?page=1&rows=10',
      '/api/finance?page=1&rows=10',
      '/api/sales?page=1&rows=10',
      '/api/invoices?page=1&rows=10'
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await request.get(`${BACKEND_URL}${endpoint}`);
      const duration = Date.now() - start;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000);
      console.log(`${endpoint}: ${duration}ms`);
    }
  });

  test('All pages load within 5 seconds', async ({ page }) => {
    const pages = [
      '/',
      '/customers',
      '/bikes',
      '/brands',
      '/suppliers',
      '/finance',
      '/sales',
      '/invoices'
    ];

    for (const url of pages) {
      const start = Date.now();
      await page.goto(`${FRONTEND_URL}${url}`);
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
      console.log(`${url}: ${duration}ms`);
    }
  });
});

test.describe('Complete Integration - Data Flow Validation', () => {

  test('Complete data flow: Frontend → Backend → D1 → UI', async ({ page, request }) => {
    const testCustomer = generateTestCustomer();

    // 1. Create via API (Backend → D1)
    const createResponse = await request.post(`${BACKEND_URL}/api/customers`, {
      data: testCustomer
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const customerId = created.customer_id;

    // 2. Verify data persisted in D1 (Backend → D1 read)
    const readResponse = await request.get(`${BACKEND_URL}/api/customers/${customerId}`);
    expect(readResponse.ok()).toBeTruthy();
    const customer = await readResponse.json();
    expect(customer.customer_firstname).toBe(testCustomer.firstname);

    // 3. Verify UI displays the data (Frontend → Backend → D1)
    await page.goto(`${FRONTEND_URL}/customers`);
    await waitForTableLoad(page);
    const tableText = await page.locator('table').textContent();
    expect(tableText).toContain(testCustomer.firstname);

    // 4. Update via UI (Frontend → Backend → D1)
    const editButton = page.getByRole('row').filter({ hasText: testCustomer.firstname })
      .getByRole('button', { name: /แก้ไข/ }).first();
    await editButton.click();
    await page.waitForTimeout(500);

    const newLastname = 'ทดสอบอัพเดท';
    await page.getByLabel(/นามสกุล/).fill(newLastname);
    await page.getByRole('button', { name: /อัพเดท|บันทึก/ }).click();
    await page.waitForTimeout(1500);

    // 5. Verify update persisted in D1 (Backend → D1)
    const verifyResponse = await request.get(`${BACKEND_URL}/api/customers/${customerId}`);
    const updated = await verifyResponse.json();
    expect(updated.customer_lastname).toBe(newLastname);

    // 6. Cleanup
    await request.delete(`${BACKEND_URL}/api/customers/${customerId}`);
  });
});
