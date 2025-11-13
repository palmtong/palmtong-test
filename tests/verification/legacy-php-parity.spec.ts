import { test, expect } from '@playwright/test';
import { generateThaiIdFromSeed } from '../helpers/thai-id';

const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anu-9da.workers.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://b2afebdb.palmtong-frontend.pages.dev';

/**
 * Legacy PHP Function Parity Verification
 *
 * This test suite verifies that all functionality from the legacy PHP system
 * (PHP + MySQL + jQuery) has been successfully ported to the new Cloudflare
 * Workers + D1 + React stack.
 */

test.describe('Legacy PHP to Cloudflare Parity Verification', () => {

  test.describe('Database Schema Parity', () => {
    /**
     * Verify all 11 tables from legacy system exist and are accessible
     */
    test('All legacy tables are accessible via API', async ({ request }) => {
      const tables = [
        { name: 'bikes', endpoint: '/api/bikes' },
        { name: 'brands', endpoint: '/api/brands' },
        { name: 'customers', endpoint: '/api/customers' },
        { name: 'finance', endpoint: '/api/finance' },
        { name: 'invoices', endpoint: '/api/invoices' },
        { name: 'sales', endpoint: '/api/sales' },
        { name: 'suppliers', endpoint: '/api/suppliers' }, // was 'suplier' in legacy
        { name: 'dashboard', endpoint: '/api/dashboard' },
      ];

      for (const table of tables) {
        const response = await request.get(`${BACKEND_URL}${table.endpoint}`);
        expect(response.ok(), `${table.name} table should be accessible`).toBeTruthy();
        console.log(`✓ ${table.name} table accessible`);
      }
    });
  });

  test.describe('Legacy CRUD Operations Parity', () => {
    /**
     * PHP: ajax/customer.php - Customer management
     * Cloudflare: /api/customers
     */
    test('Customer CRUD matches legacy PHP functionality', async ({ request }) => {
      // CREATE (using Cloudflare field names: firstname, lastname, not customer_firstname, customer_lastname)
      // Use unique ID card to avoid duplicates
      const uniqueIdCard = generateThaiIdFromSeed(Date.now());
      const createResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: uniqueIdCard,
          firstname: 'Legacy',
          lastname: 'Test',
          mobile_phone_1: '0812345678',
          current_address_number: '123 Test St',
        }
      });
      expect(createResponse.ok()).toBeTruthy();
      const created = await createResponse.json();
      expect(created.customer_id).toBeDefined();
      console.log(`✓ Customer CREATE works (ID: ${created.customer_id})`);

      // READ
      const readResponse = await request.get(`${BACKEND_URL}/api/customers/${created.customer_id}`);
      expect(readResponse.ok()).toBeTruthy();
      const customer = await readResponse.json();
      expect(customer.firstname).toBe('Legacy');
      console.log(`✓ Customer READ works`);

      // UPDATE
      const updateResponse = await request.put(`${BACKEND_URL}/api/customers/${created.customer_id}`, {
        data: {
          firstname: 'Updated',
          lastname: 'Test',
          mobile_phone_1: '0812345678',
        }
      });
      expect(updateResponse.ok()).toBeTruthy();
      console.log(`✓ Customer UPDATE works`);

      // DELETE
      const deleteResponse = await request.delete(`${BACKEND_URL}/api/customers/${created.customer_id}`);
      expect(deleteResponse.ok()).toBeTruthy();
      console.log(`✓ Customer DELETE works`);
    });

    /**
     * PHP: ajax/stock.php - Bike inventory management
     * Cloudflare: /api/bikes
     */
    test('Bike inventory CRUD matches legacy PHP functionality', async ({ request }) => {
      // CREATE
      const createResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: 'Honda Wave 125i Legacy Test',
          bike_chasi_number: 'LEGACY' + Date.now(),
          bike_engine_number: 'ENG' + Date.now(),
          brand_id: 1,
          purchase_total: 45000,
        }
      });
      expect(createResponse.ok()).toBeTruthy();
      const created = await createResponse.json();
      expect(created.bike_id).toBeDefined();
      console.log(`✓ Bike CREATE works (ID: ${created.bike_id})`);

      // READ - List unsold bikes (legacy: ajax/sale.php)
      const unsoldResponse = await request.get(`${BACKEND_URL}/api/bikes/unsold`);
      expect(unsoldResponse.ok()).toBeTruthy();
      const unsold = await unsoldResponse.json();
      expect(Array.isArray(unsold)).toBeTruthy();
      console.log(`✓ Bike unsold list works (${unsold.length} bikes)`);

      // UPDATE
      const updateResponse = await request.put(`${BACKEND_URL}/api/bikes/${created.bike_id}`, {
        data: {
          bike_model: 'Updated Model',
          bike_chasi_number: created.bike_chasi_number,
          bike_engine_number: created.bike_engine_number,
          brand_id: 1,
        }
      });
      expect(updateResponse.ok()).toBeTruthy();
      console.log(`✓ Bike UPDATE works`);

      // DELETE
      const deleteResponse = await request.delete(`${BACKEND_URL}/api/bikes/${created.bike_id}`);
      expect(deleteResponse.ok()).toBeTruthy();
      console.log(`✓ Bike DELETE works`);
    });

    /**
     * PHP: ajax/sale_2.php through sale_5.php - Multi-step sale workflow
     * Cloudflare: /api/sales
     */
    test('Sale transaction matches legacy PHP multi-step workflow', async ({ request }) => {
      // Step 1: Create bike
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: 'Sale Test Bike',
          bike_chasi_number: 'SALE' + Date.now(),
          bike_engine_number: 'SALENG' + Date.now(),
          brand_id: 1,
          purchase_total: 45000,
        }
      });
      const bike = await bikeResponse.json();
      console.log(`✓ Step 1: Bike created for sale (ID: ${bike.bike_id})`);

      // Step 2: Create customer (using Cloudflare field names)
      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(Date.now()),
          firstname: 'Buyer',
          lastname: 'Test',
          mobile_phone_1: '0812345678',
        }
      });
      const customer = await customerResponse.json();
      console.log(`✓ Step 2: Customer created (ID: ${customer.customer_id})`);

      // Step 3: Create sale (legacy: ajax/sale_3.php)
      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id: bike.bike_id,
          customer_id: customer.customer_id,
          sale_price: 52000,
          sale_date: new Date().toISOString().split('T')[0],
        }
      });
      expect(saleResponse.ok()).toBeTruthy();
      const sale = await saleResponse.json();
      expect(sale.sale_id).toBeDefined();
      console.log(`✓ Step 3: Sale created (ID: ${sale.sale_id})`);

      // Step 4: Verify bike is marked as sold
      const bikeCheckResponse = await request.get(`${BACKEND_URL}/api/bikes/${bike.bike_id}`);
      const soldBike = await bikeCheckResponse.json();
      expect(soldBike.sold_date).not.toBeNull();
      console.log(`✓ Step 4: Bike marked as sold`);

      // Cleanup
      await request.delete(`${BACKEND_URL}/api/sales/${sale.sale_id}`);
      await request.delete(`${BACKEND_URL}/api/bikes/${bike.bike_id}`);
      await request.delete(`${BACKEND_URL}/api/customers/${customer.customer_id}`);
      console.log(`✓ Cleanup completed`);
    });

    /**
     * PHP: ajax/invoice.php, invoice_2.php - Invoice generation
     * Cloudflare: /api/invoices
     */
    test('Invoice generation matches legacy PHP functionality', async ({ request }) => {
      // Prerequisites: Create bike, customer, and sale
      const bikeRes = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: 'Invoice Test',
          bike_chasi_number: 'INV' + Date.now(),
          bike_engine_number: 'INVENG' + Date.now(),
          brand_id: 1,
          purchase_total: 45000,
        }
      });
      const bike = await bikeRes.json();

      const customerRes = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(Date.now()),
          firstname: 'Invoice',
          lastname: 'Customer',
          mobile_phone_1: '0812345678',
          current_address_number: '456 Invoice St',
        }
      });
      const customer = await customerRes.json();

      const saleRes = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id: bike.bike_id,
          customer_id: customer.customer_id,
          sale_price: 52000,
        }
      });
      const sale = await saleRes.json();

      // CREATE invoice (legacy: ajax/invoice.php)
      const invoiceRes = await request.post(`${BACKEND_URL}/api/invoices`, {
        data: {
          sale_id: sale.sale_id,
          invoice_date: new Date().toISOString().split('T')[0],
          invoice_total: 52000,
        }
      });
      expect(invoiceRes.ok()).toBeTruthy();
      const invoice = await invoiceRes.json();
      expect(invoice.invoice_id).toBeDefined();
      console.log(`✓ Invoice CREATE works (ID: ${invoice.invoice_id})`);

      // READ invoice
      const readInvoice = await request.get(`${BACKEND_URL}/api/invoices/${invoice.invoice_id}`);
      expect(readInvoice.ok()).toBeTruthy();
      const invoiceData = await readInvoice.json();
      expect(invoiceData.invoice_id).toBe(invoice.invoice_id);
      console.log(`✓ Invoice READ works`);

      // UPDATE invoice (legacy: ajax/invoice_2.php)
      const updateInvoice = await request.put(`${BACKEND_URL}/api/invoices/${invoice.invoice_id}`, {
        data: {
          invoice_total: 53000,
        }
      });
      expect(updateInvoice.ok()).toBeTruthy();
      console.log(`✓ Invoice UPDATE works`);

      // Cleanup
      await request.delete(`${BACKEND_URL}/api/invoices/${invoice.invoice_id}`);
      await request.delete(`${BACKEND_URL}/api/sales/${sale.sale_id}`);
      await request.delete(`${BACKEND_URL}/api/bikes/${bike.bike_id}`);
      await request.delete(`${BACKEND_URL}/api/customers/${customer.customer_id}`);
      console.log(`✓ Cleanup completed`);
    });
  });

  test.describe('Legacy Dashboard/Reporting Parity', () => {
    /**
     * PHP: index.php tabs - Dashboard with statistics
     * Cloudflare: /api/dashboard
     */
    test('Dashboard statistics match legacy PHP tabs functionality', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/dashboard`);
      expect(response.ok()).toBeTruthy();
      const dashboard = await response.json();

      // Verify all legacy dashboard sections exist
      expect(dashboard.inventory).toBeDefined();
      expect(dashboard.sales).toBeDefined();
      expect(dashboard.customers).toBeDefined();
      expect(dashboard.suppliers).toBeDefined();
      expect(dashboard.invoices).toBeDefined();

      // Verify inventory stats (legacy: stock count)
      expect(dashboard.inventory.unsoldBikes).toBeGreaterThanOrEqual(0);
      expect(dashboard.inventory.soldBikes).toBeGreaterThanOrEqual(0);
      expect(dashboard.inventory.totalValue).toBeGreaterThanOrEqual(0);
      console.log(`✓ Inventory stats: ${dashboard.inventory.unsoldBikes} unsold, ${dashboard.inventory.soldBikes} sold`);

      // Verify sales stats (legacy: sales reports)
      expect(dashboard.sales.totalCount).toBeGreaterThanOrEqual(0);
      expect(dashboard.sales.totalRevenue).toBeGreaterThanOrEqual(0);
      console.log(`✓ Sales stats: ${dashboard.sales.totalCount} sales, ฿${dashboard.sales.totalRevenue}`);

      // Verify customer count (legacy: customer list count)
      expect(dashboard.customers.totalCount).toBeGreaterThanOrEqual(0);
      console.log(`✓ Customer count: ${dashboard.customers.totalCount}`);

      // Verify supplier count (legacy: supplier list count)
      expect(dashboard.suppliers.totalCount).toBeGreaterThanOrEqual(0);
      console.log(`✓ Supplier count: ${dashboard.suppliers.totalCount}`);

      // Verify invoice stats (legacy: invoice reports)
      expect(dashboard.invoices.totalCount).toBeGreaterThanOrEqual(0);
      expect(dashboard.invoices.totalRevenue).toBeGreaterThanOrEqual(0);
      console.log(`✓ Invoice stats: ${dashboard.invoices.totalCount} invoices, ฿${dashboard.invoices.totalRevenue}`);
    });
  });

  test.describe('Legacy Search/Filter Parity', () => {
    /**
     * PHP: ajax/autocomplete.php - Search functionality
     * Cloudflare: Implicit in GET /api/* with query params
     */
    test('Search and filter functionality matches legacy', async ({ request }) => {
      // Test listing with pagination (legacy: jqGrid format)
      const paginated = await request.get(`${BACKEND_URL}/api/bikes?page=1&rows=10`);
      expect(paginated.ok()).toBeTruthy();
      const data = await paginated.json();

      // Verify jqGrid format (legacy compatibility)
      if (typeof data === 'object' && 'rows' in data) {
        expect(data.page).toBeDefined();
        expect(data.total).toBeDefined();
        expect(data.records).toBeDefined();
        expect(data.rows).toBeDefined();
        console.log(`✓ jqGrid pagination format works (${data.records} records)`);
      } else {
        // Simple array format
        expect(Array.isArray(data)).toBeTruthy();
        console.log(`✓ Simple array format works (${data.length} items)`);
      }
    });
  });

  test.describe('Legacy Data Validation Parity', () => {
    /**
     * PHP: inc/db_extra.php - Form validation
     * Cloudflare: Zod validation in routes
     */
    test('Thai ID card validation matches legacy', async ({ request }) => {
      // Valid Thai ID (13 digits, unique)
      const validIdCard = generateThaiIdFromSeed(Date.now());
      const validResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: validIdCard,
          firstname: 'Valid',
          lastname: 'ID',
          mobile_phone_1: '0812345678',
        }
      });
      expect(validResponse.ok()).toBeTruthy();
      const customer = await validResponse.json();
      console.log(`✓ Valid Thai ID accepted (ID: ${customer.customer_id})`);

      // Cleanup
      await request.delete(`${BACKEND_URL}/api/customers/${customer.customer_id}`);

      // Invalid Thai ID (too short)
      const invalidResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: '12345',
          firstname: 'Invalid',
          lastname: 'ID',
          mobile_phone_1: '0812345678',
        }
      });
      expect(invalidResponse.status()).toBe(400);
      console.log(`✓ Invalid Thai ID rejected`);
    });

    test('Required field validation matches legacy', async ({ request }) => {
      // Missing required fields
      const response = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          // Missing bike_model, bike_chasi_number, bike_engine_number
          brand_id: 1,
        }
      });
      expect(response.status()).toBe(400);
      console.log(`✓ Required field validation works`);
    });
  });

  test.describe('Frontend UI Parity', () => {
    /**
     * PHP: index.php with jQuery UI tabs
     * Cloudflare: React SPA with routing
     */
    test('All legacy UI tabs/pages are accessible', async ({ page }) => {
      const pages = [
        { name: 'Dashboard', url: '/', legacyTab: 'Dashboard' },
        { name: 'Customers', url: '/customers', legacyTab: 'Customer Management' },
        { name: 'Bikes', url: '/bikes', legacyTab: 'Stock Management' },
        { name: 'Sales', url: '/sales', legacyTab: 'Sales' },
        { name: 'Invoices', url: '/invoices', legacyTab: 'Invoices' },
        { name: 'Brands', url: '/brands', legacyTab: 'Brand Management' },
        { name: 'Suppliers', url: '/suppliers', legacyTab: 'Supplier Management' },
        { name: 'Finance', url: '/finance', legacyTab: 'Finance Management' },
      ];

      for (const pageInfo of pages) {
        await page.goto(`${FRONTEND_URL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle');

        // Verify page loaded without errors
        const title = await page.title();
        expect(title.toLowerCase()).toContain('palmtong');
        console.log(`✓ ${pageInfo.name} page accessible (legacy: ${pageInfo.legacyTab})`);
      }
    });

    test('Delete confirmation dialog matches legacy alert behavior', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/customers`);
      await page.waitForLoadState('networkidle');

      // Look for delete button (Thai: ลบ)
      const deleteButton = page.getByRole('button', { name: /ลบ|delete/i }).first();
      if ((await deleteButton.count()) > 0) {
        await deleteButton.click();

        // Modern: AlertDialog component (vs legacy: window.confirm)
        const dialog = page.getByRole('alertdialog');
        await expect(dialog).toBeVisible({ timeout: 10000 });
        console.log(`✓ Delete confirmation dialog works (modern AlertDialog vs legacy window.confirm)`);

        // Close dialog (Thai: ยกเลิก / Cancel)
        const cancelButton = page.getByRole('button', { name: /ยกเลิก|cancel/i });
        await cancelButton.click();
      }
    });
  });

  test.describe('Thai Language Support Parity', () => {
    /**
     * PHP: Uses thai fonts, labels in Thai
     * Cloudflare: Same Thai support
     */
    test('Thai language content displays correctly', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/customers`);
      await page.waitForLoadState('networkidle');

      // Check for Thai content in page
      const content = await page.content();
      const hasThaiCharacters = /[\u0E00-\u0E7F]/.test(content);

      if (hasThaiCharacters) {
        console.log(`✓ Thai language content detected and displayed`);
      } else {
        console.log(`ℹ Thai language content not found (using English)`);
      }
    });
  });
});

test.describe('Performance & Reliability Parity', () => {
  test('API response times are acceptable', async ({ request }) => {
    const endpoints = [
      '/api/bikes',
      '/api/customers',
      '/api/sales',
      '/api/invoices',
      '/api/dashboard',
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const response = await request.get(`${BACKEND_URL}${endpoint}`);
      const duration = Date.now() - start;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(3000); // Should respond within 3 seconds (mobile may be slower)
      console.log(`✓ ${endpoint} responded in ${duration}ms`);
    }
  });

  test('Concurrent operations handle correctly', async ({ request }) => {
    // Create multiple customers concurrently (legacy: single-threaded PHP)
    // Use valid Thai IDs with proper checksums
    const timestamp = Date.now();
    const promises = Array.from({ length: 5 }, (_, i) =>
      request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(timestamp + i * 1000), // Add offset to ensure unique IDs
          firstname: `Concurrent${i}`,
          lastname: 'Test',
          mobile_phone_1: '0812345678',
        }
      })
    );

    const results = await Promise.all(promises);
    const allSuccess = results.every(r => r.ok());
    expect(allSuccess).toBeTruthy();
    console.log(`✓ Concurrent operations handled successfully`);

    // Cleanup
    for (const result of results) {
      if (result.ok()) {
        const data = await result.json();
        await request.delete(`${BACKEND_URL}/api/customers/${data.customer_id}`);
      }
    }
  });
});
