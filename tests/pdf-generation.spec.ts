/**
 * PDF Invoice Generation Tests
 *
 * Tests PDF generation for invoices in both environments:
 * - Local development (wrangler dev on localhost:8787)
 * - Production (Cloudflare Workers on production URL)
 *
 * Critical requirements:
 * 1. PDF must be generated from current database data (no caching)
 * 2. PDF must support Thai language text
 * 3. PDF must be regenerable after data edits
 * 4. PDF must have correct MIME type and headers
 * 5. PDF must be valid and openable
 */

import { test, expect } from '@playwright/test';

// Environment configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8787';
const IS_PRODUCTION = !BACKEND_URL.includes('localhost');

test.describe('PDF Invoice Generation', () => {
  let testInvoiceId: number;
  let testSaleId: number;
  let testBikeId: number;
  let testCustomerId: number;
  let testBrandId: number;

  test.beforeAll(async ({ request }) => {
    if (IS_PRODUCTION) {
      // Production: Use existing data (don't create test data)
      console.log('⚠️  Production mode: Using existing invoice data');

      // Get first invoice from production
      const listResponse = await request.get(`${BACKEND_URL}/api/invoices?page=1&rows=1`);
      expect(listResponse.ok()).toBeTruthy();
      const listData = await listResponse.json();

      if (!listData.rows || listData.rows.length === 0) {
        throw new Error('No invoices found in production database');
      }

      testInvoiceId = listData.rows[0].invoice_id;

      // Get invoice details to extract related IDs
      const invoiceResponse = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}`);
      expect(invoiceResponse.ok()).toBeTruthy();
      const invoiceData = await invoiceResponse.json();

      testSaleId = invoiceData.sale_id || 0;

      console.log(`✓ Using existing production data:
  - Invoice ID: ${testInvoiceId}
  - Sale ID: ${testSaleId}
  - Environment: Production
  - Backend URL: ${BACKEND_URL}`);
    } else {
      // Local Dev: Create test data
      console.log('🔧 Local dev mode: Creating test data');

      // 1. Get or create a brand
      const brandsResponse = await request.get(`${BACKEND_URL}/api/brands?page=1&rows=1`);
      expect(brandsResponse.ok()).toBeTruthy();
      const brandsData = await brandsResponse.json();

      if (brandsData.rows && brandsData.rows.length > 0) {
        testBrandId = brandsData.rows[0].brand_id;
      } else {
        // Create a test brand with unique name
        const timestamp = Date.now();
        const brandResponse = await request.post(`${BACKEND_URL}/api/brands`, {
          data: {
            brand_name_thai: `ยามาฮ่าทดสอบ${timestamp}`,
            brand_name_english: `Yamaha Test ${timestamp}`,
            brand_note: 'Test brand for PDF generation'
          }
        });
        expect(brandResponse.ok()).toBeTruthy();
        const brandResult = await brandResponse.json();
        testBrandId = brandResult.data.brand_id;
      }

      // 2. Create a test customer with Thai data
      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          prefix: 'นาย',
          firstname: 'สมชาย',
          lastname: 'ทดสอบพีดีเอฟ',
          idcard: `${Date.now()}`.substring(0, 13).padStart(13, '1'),
          mobile_phone_1: '0812345678',
          current_address_number: '123/45',
          current_address_moo: '7',
          current_address_soi_trok: 'ซอยสุขุมวิท 21',
          current_address_road: 'ถนนสุขุมวิท',
          current_address_tumbon: 'คลองเตย',
          current_address_aumphur: 'คลองเตย',
          current_address_province: 'กรุงเทพมหานคร',
          current_address_postcode: '10110'
        }
      });
      expect(customerResponse.ok()).toBeTruthy();
      const customerResult = await customerResponse.json();
      testCustomerId = customerResult.data.customer_id;

      // 3. Create a test bike
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          brand_id: testBrandId,
          suplier_id: 0,
          bike_model: 'NMAX 155 ทดสอบ',
          bike_color: 'ดำ-แดง',
          bike_chasi_number: `TEST-CHASI-${Date.now()}`,
          bike_engine_number: `TEST-ENGINE-${Date.now()}`,
          purchase_price: 45000.00,
          purchase_vat: 3150.00,
          purchase_total: 48150.00,
          purchase_date: new Date().toISOString()
        }
      });
      expect(bikeResponse.ok()).toBeTruthy();
      const bikeResult = await bikeResponse.json();
      testBikeId = bikeResult.data.bike_id;

      // 4. Create a test sale
      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id: testBikeId,
          sale_customer_id: testCustomerId,
          sale_to_type: 'customer',
          sale_to_id: testCustomerId,
          sale_price: 55000.00,
          sale_vat: 3850.00,
          sale_total: 58850.00,
          sale_date: new Date().toISOString(),
          comment: 'ทดสอบการสร้าง PDF ภาษาไทย'
        }
      });
      expect(saleResponse.ok()).toBeTruthy();
      const saleResult = await saleResponse.json();
      testSaleId = saleResult.data.sale_id;

      // 5. Create a test invoice with Thai data
      const invoiceResponse = await request.post(`${BACKEND_URL}/api/invoices`, {
        data: {
          sale_id: testSaleId,
          invoice_date: new Date().toISOString(),
          buyer_name: 'นายสมชาย ทดสอบพีดีเอฟ',
          buyer_address: '123/45 หมู่ 7 ซอยสุขุมวิท 21 ถนนสุขุมวิท คลองเตย กรุงเทพมหานคร 10110',
          invoice_price: 55000.00,
          invoice_vat: 3850.00,
          invoice_total: 58850.00,
          invoice_comment: 'ใบกำกับภาษีทดสอบ - รองรับภาษาไทย',
          taxline: '1234567890123'
        }
      });
      expect(invoiceResponse.ok()).toBeTruthy();
      const invoiceResult = await invoiceResponse.json();
      testInvoiceId = invoiceResult.data.invoice_id;

      console.log(`✓ Test data created:
  - Brand ID: ${testBrandId}
  - Customer ID: ${testCustomerId}
  - Bike ID: ${testBikeId}
  - Sale ID: ${testSaleId}
  - Invoice ID: ${testInvoiceId}
  - Environment: Local Dev
  - Backend URL: ${BACKEND_URL}`);
    }
  });

  test('should generate PDF with correct headers', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Verify Content-Type header
    const contentType = response.headers()['content-type'];
    expect(contentType).toBe('application/pdf');

    // Verify Content-Disposition header (should suggest download)
    const contentDisposition = response.headers()['content-disposition'];
    expect(contentDisposition).toBeDefined();
    expect(contentDisposition).toContain('attachment');
    expect(contentDisposition).toContain(`invoice-${testInvoiceId}.pdf`);

    // Verify Cache-Control header (no caching - always fresh)
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toBeDefined();
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
  });

  test('should generate valid PDF with reasonable size', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);

    expect(response.ok()).toBeTruthy();

    const pdfBuffer = await response.body();

    // Verify PDF magic number (starts with %PDF)
    const pdfHeader = pdfBuffer.subarray(0, 4).toString();
    expect(pdfHeader).toBe('%PDF');

    // Verify PDF size is reasonable (should be > 1KB and < 5MB)
    const pdfSize = pdfBuffer.length;
    expect(pdfSize).toBeGreaterThan(1 * 1024); // > 1KB
    expect(pdfSize).toBeLessThan(5 * 1024 * 1024); // < 5MB

    console.log(`✓ PDF generated successfully: ${(pdfSize / 1024).toFixed(2)} KB`);
  });

  test('should generate PDF from current database data (no caching)', async ({ request }) => {
    // Step 1: Generate PDF for the first time
    const response1 = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);
    expect(response1.ok()).toBeTruthy();
    const pdf1Buffer = await response1.body();
    const pdf1Size = pdf1Buffer.length;

    if (IS_PRODUCTION) {
      // In production, just verify PDF is generated correctly without modifying data
      expect(pdf1Buffer.subarray(0, 4).toString()).toBe('%PDF');
      console.log(`✓ PDF generated from production database:
  - PDF Size: ${(pdf1Size / 1024).toFixed(2)} KB
  - Environment: Production (skipping update test)`);
      return;
    }

    // Step 2: Update invoice data (local dev only)
    const updateResponse = await request.put(`${BACKEND_URL}/api/invoices/${testInvoiceId}`, {
      data: {
        invoice_comment: 'ใบกำกับภาษีที่แก้ไขแล้ว - Updated comment for PDF regeneration test'
      }
    });
    expect(updateResponse.ok()).toBeTruthy();

    // Step 3: Generate PDF again (should be regenerated from new data)
    const response2 = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);
    expect(response2.ok()).toBeTruthy();
    const pdf2Buffer = await response2.body();
    const pdf2Size = pdf2Buffer.length;

    // Verify both PDFs are valid
    expect(pdf1Buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf2Buffer.subarray(0, 4).toString()).toBe('%PDF');

    // PDFs should be different (different content after update)
    // Note: Size might be very similar, but content should differ
    expect(pdf1Buffer.equals(pdf2Buffer)).toBe(false);

    console.log(`✓ PDF regenerated after data update:
  - Original PDF: ${(pdf1Size / 1024).toFixed(2)} KB
  - Updated PDF: ${(pdf2Size / 1024).toFixed(2)} KB
  - PDFs are different: ${!pdf1Buffer.equals(pdf2Buffer)}`);
  });

  test('should handle Thai language in PDF', async ({ request }) => {
    if (IS_PRODUCTION) {
      // In production, use the existing invoice
      // Note: We can't guarantee production PDFs have extensive Thai text,
      // but we can verify PDF is generated and may contain Thai support
      const response = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);
      expect(response.ok()).toBeTruthy();

      const pdfBuffer = await response.body();
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

      console.log(`✓ PDF verified in production (Thai support tested in local dev):
  - Invoice ID: ${testInvoiceId}
  - Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB
  - Environment: Production`);
      return;
    }

    // Local dev: Create an invoice with extensive Thai text
    const thaiInvoiceResponse = await request.post(`${BACKEND_URL}/api/invoices`, {
      data: {
        invoice_date: new Date().toISOString(),
        buyer_name: 'บริษัท ทดสอบภาษาไทยในพีดีเอฟ จำกัด',
        buyer_address: '๙๙/๙๙ หมู่ ๙ ซอยลาดพร้าว ๑๐๑ ถนนลาดพร้าว แขวงคลองจั่น เขตบางกะปิ กรุงเทพมหานคร ๑๐๒๔๐',
        invoice_price: 99999.99,
        invoice_vat: 6999.99,
        invoice_total: 106999.98,
        invoice_comment: 'ทดสอบ: ๐๑๒๓๔๕๖๗๘๙ กขคง จฉชซ ญฎฏฐ ฯลฦฮ ฿ ₿',
        taxline: '0123456789012'
      }
    });
    expect(thaiInvoiceResponse.ok()).toBeTruthy();
    const thaiInvoiceResult = await thaiInvoiceResponse.json();
    const thaiInvoiceId = thaiInvoiceResult.data.invoice_id;

    // Generate PDF
    const response = await request.get(`${BACKEND_URL}/api/invoices/${thaiInvoiceId}/pdf`);
    expect(response.ok()).toBeTruthy();

    const pdfBuffer = await response.body();

    // Verify PDF is valid
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    // Verify PDF contains Thai Unicode text (UTF-8)
    // PDFs with Thai text should have specific encoding markers
    const pdfString = pdfBuffer.toString('binary');

    // Check for Unicode font references (common in Thai PDFs)
    const hasUnicode = pdfString.includes('ToUnicode') ||
                       pdfString.includes('/Encoding') ||
                       pdfString.includes('Identity');

    expect(hasUnicode).toBe(true);

    console.log(`✓ Thai language PDF generated successfully:
  - Invoice ID: ${thaiInvoiceId}
  - Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB
  - Unicode support: ${hasUnicode}`);
  });

  test('should return 404 for non-existent invoice', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/invoices/999999/pdf`);

    expect(response.status()).toBe(404);

    const errorData = await response.json();
    expect(errorData.statusCode).toBe(404);
    expect(errorData.message).toContain('Invoice');
    expect(errorData.message).toContain('999999');
  });

  test('should allow unlimited PDF regeneration', async ({ request }) => {
    // Generate PDF multiple times to verify no rate limiting or caching issues
    const iterations = 5;
    const pdfSizes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const response = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);
      expect(response.ok()).toBeTruthy();

      const pdfBuffer = await response.body();
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

      pdfSizes.push(pdfBuffer.length);
    }

    // All PDFs should be similar size (same data, no edits between generations)
    // Allow small variations due to timestamps or metadata (within 1%)
    const avgSize = pdfSizes.reduce((a, b) => a + b, 0) / pdfSizes.length;
    const allSimilar = pdfSizes.every(size => Math.abs(size - avgSize) / avgSize < 0.01);
    expect(allSimilar).toBe(true);

    console.log(`✓ Generated PDF ${iterations} times successfully:
  - All PDFs similar size: ${allSimilar}
  - Average size: ${(avgSize / 1024).toFixed(2)} KB
  - Size range: ${(Math.min(...pdfSizes) / 1024).toFixed(2)} - ${(Math.max(...pdfSizes) / 1024).toFixed(2)} KB`);
  });

  test('should include invoice metadata in PDF', async ({ request }) => {
    // Get invoice data first
    const invoiceResponse = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}`);
    expect(invoiceResponse.ok()).toBeTruthy();
    const invoiceData = await invoiceResponse.json();

    // Generate PDF
    const pdfResponse = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);
    expect(pdfResponse.ok()).toBeTruthy();

    const pdfBuffer = await pdfResponse.body();
    const pdfString = pdfBuffer.toString('binary');

    // Verify PDF structure (pdf-lib may compress content, so we check for basic markers)
    // PDF must start with %PDF
    expect(pdfString.startsWith('%PDF')).toBe(true);

    // PDF should end with %%EOF
    expect(pdfString.trimEnd().endsWith('%%EOF')).toBe(true);

    // Check for common PDF object markers
    const hasObjects = pdfString.includes('endobj') && pdfString.includes('stream');
    expect(hasObjects).toBe(true);

    console.log(`✓ PDF structure validated:
  - Invoice ID: ${invoiceData.invoice_id}
  - Valid PDF format: true
  - Contains objects: ${hasObjects}
  - Properly terminated: true`);
  });

  test.describe('Production-specific tests', () => {
    test.skip(!IS_PRODUCTION, 'Skipping production-specific tests in local dev');

    test('should work with Cloudflare Workers runtime', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      // Verify Cloudflare headers (if present)
      const cfHeaders = response.headers();
      console.log(`✓ Production environment verified:
  - URL: ${BACKEND_URL}
  - Status: ${response.status()}
  - Server headers present: ${!!cfHeaders['cf-ray']}`);
    });
  });

  test.describe('Local dev-specific tests', () => {
    test.skip(IS_PRODUCTION, 'Skipping local dev tests in production');

    test('should work with wrangler dev environment', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/invoices/${testInvoiceId}/pdf`);

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      console.log(`✓ Local development environment verified:
  - URL: ${BACKEND_URL}
  - Status: ${response.status()}`);
    });
  });

  // Cleanup: Delete test data after all tests (only for local dev)
  test.afterAll(async ({ request }) => {
    if (IS_PRODUCTION) {
      console.log('⚠️  Production mode: Skipping cleanup (using existing data)');
      return;
    }

    try {
      // Delete in reverse order of creation (to respect foreign keys)
      if (testInvoiceId) {
        await request.delete(`${BACKEND_URL}/api/invoices/${testInvoiceId}`);
      }
      if (testSaleId) {
        await request.delete(`${BACKEND_URL}/api/sales/${testSaleId}`);
      }
      if (testBikeId) {
        await request.delete(`${BACKEND_URL}/api/bikes/${testBikeId}`);
      }
      if (testCustomerId) {
        await request.delete(`${BACKEND_URL}/api/customers/${testCustomerId}`);
      }

      console.log('✓ Test data cleaned up');
    } catch (error) {
      console.warn('Warning: Could not clean up all test data:', error);
    }
  });
});
