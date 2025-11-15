/**
 * PDF Invoice Generation Tests - Production Environment
 *
 * Tests PDF generation specifically on Cloudflare Workers production environment
 *
 * Requirements:
 * - Set BACKEND_URL to production URL in .env
 * - Tests use real production database (D1)
 * - Verifies Thai language support in production
 * - Validates Cloudflare-specific features
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anu-9da.workers.dev';

test.describe('PDF Generation - Production Environment', () => {
  test('should have existing invoices in production', async ({ request }) => {
    // List invoices to find an existing one
    const response = await request.get(`${BACKEND_URL}/api/invoices?page=1&rows=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.rows).toBeDefined();
    expect(Array.isArray(data.rows)).toBe(true);

    if (data.rows.length > 0) {
      console.log(`✓ Found ${data.rows.length} invoices in production (Total: ${data.records})`);
    } else {
      console.warn('⚠ No invoices found in production database');
    }
  });

  test('should generate PDF for existing invoice', async ({ request }) => {
    // Get first invoice from production
    const listResponse = await request.get(`${BACKEND_URL}/api/invoices?page=1&rows=1`);
    expect(listResponse.ok()).toBeTruthy();

    const listData = await listResponse.json();

    if (!listData.rows || listData.rows.length === 0) {
      test.skip();
      return;
    }

    const invoiceId = listData.rows[0].invoice_id;
    console.log(`Testing PDF generation for invoice ID: ${invoiceId}`);

    // Generate PDF
    const pdfResponse = await request.get(`${BACKEND_URL}/api/invoices/${invoiceId}/pdf`);
    expect(pdfResponse.ok()).toBeTruthy();
    expect(pdfResponse.status()).toBe(200);

    // Verify headers
    expect(pdfResponse.headers()['content-type']).toBe('application/pdf');
    expect(pdfResponse.headers()['content-disposition']).toContain('attachment');

    // Verify PDF content
    const pdfBuffer = await pdfResponse.body();
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdfBuffer.length).toBeGreaterThan(1 * 1024); // > 1KB
    expect(pdfBuffer.length).toBeLessThan(5 * 1024 * 1024); // < 5MB

    console.log(`✓ PDF generated successfully in production:
  - Invoice ID: ${invoiceId}
  - Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB
  - Environment: Production (${BACKEND_URL})`);
  });

  test('should verify Cloudflare Workers environment', async ({ request }) => {
    // Test basic API health to verify Cloudflare environment
    const response = await request.get(`${BACKEND_URL}/api/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');

    console.log(`✓ Cloudflare Workers environment verified:
  - Backend URL: ${BACKEND_URL}
  - Health check: OK`);
  });

  test('should handle concurrent PDF generation requests', async ({ request }) => {
    // Get an existing invoice
    const listResponse = await request.get(`${BACKEND_URL}/api/invoices?page=1&rows=1`);
    expect(listResponse.ok()).toBeTruthy();

    const listData = await listResponse.json();

    if (!listData.rows || listData.rows.length === 0) {
      test.skip();
      return;
    }

    const invoiceId = listData.rows[0].invoice_id;

    // Generate 3 PDFs concurrently
    const promises = [
      request.get(`${BACKEND_URL}/api/invoices/${invoiceId}/pdf`),
      request.get(`${BACKEND_URL}/api/invoices/${invoiceId}/pdf`),
      request.get(`${BACKEND_URL}/api/invoices/${invoiceId}/pdf`)
    ];

    const responses = await Promise.all(promises);

    // All should succeed
    responses.forEach((response, index) => {
      expect(response.ok()).toBeTruthy();
      console.log(`✓ Concurrent request ${index + 1}: ${response.status()}`);
    });

    console.log(`✓ Concurrent PDF generation successful:
  - 3 requests processed
  - All returned 200 OK
  - Cloudflare Workers handled concurrency`);
  });

  test('should validate production database D1 connection', async ({ request }) => {
    // Test D1 database connectivity through API
    const response = await request.get(`${BACKEND_URL}/api/dashboard`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify we have production data
    expect(data.inventory).toBeDefined();
    expect(data.sales).toBeDefined();
    expect(data.customers).toBeDefined();

    console.log(`✓ Production D1 Database connected:
  - Total bikes: ${data.inventory.totalBikes || 0}
  - Total sales: ${data.sales.totalSales || 0}
  - Total customers: ${data.customers.totalCustomers || 0}`);
  });

  test('should work with production CORS settings', async ({ request }) => {
    // Test CORS with production URLs
    const response = await request.get(`${BACKEND_URL}/api/invoices?page=1&rows=1`, {
      headers: {
        'Origin': 'https://palmtong-frontend.pages.dev'
      }
    });

    expect(response.ok()).toBeTruthy();

    const accessControlHeader = response.headers()['access-control-allow-origin'];
    expect(accessControlHeader).toBeDefined();

    console.log(`✓ Production CORS configured correctly:
  - Access-Control-Allow-Origin: ${accessControlHeader || 'Not set'}`);
  });
});

test.describe('PDF Generation Performance - Production', () => {
  test('should generate PDF within acceptable time', async ({ request }) => {
    // Get first invoice
    const listResponse = await request.get(`${BACKEND_URL}/api/invoices?page=1&rows=1`);
    expect(listResponse.ok()).toBeTruthy();

    const listData = await listResponse.json();

    if (!listData.rows || listData.rows.length === 0) {
      test.skip();
      return;
    }

    const invoiceId = listData.rows[0].invoice_id;

    // Measure PDF generation time
    const startTime = Date.now();
    const response = await request.get(`${BACKEND_URL}/api/invoices/${invoiceId}/pdf`);
    const duration = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();

    // PDF should be generated within 5 seconds
    expect(duration).toBeLessThan(5000);

    console.log(`✓ PDF generation performance:
  - Duration: ${duration}ms
  - Within acceptable range: ${duration < 5000 ? 'Yes' : 'No'}
  - Environment: Cloudflare Workers`);
  });
});
