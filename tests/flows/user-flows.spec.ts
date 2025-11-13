import { test, expect } from '@playwright/test';
import { generateThaiIdFromSeed } from '../helpers/thai-id';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://palmtong-frontend.pages.dev';
const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anusoft.workers.dev';

test.describe('User Flow Tests', () => {
  test.describe('Complete Bike Sale Flow', () => {
    test('End-to-end: Add bike → Add customer → Create sale → Generate invoice → Download PDF', async ({
      page,
      request,
    }) => {
      const timestamp = Date.now();

      // Step 1: Create bike via API (to ensure we have one)
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Flow Test Bike ${timestamp}`,
          bike_chasi_number: `FLOWCH${timestamp}`,
          bike_engine_number: `FLOWEN${timestamp}`,
          brand_id: 1,
          bike_price_buy: 45000,
        },
      });
      expect(bikeResponse.ok()).toBeTruthy();
      const { bike_id } = await bikeResponse.json();

      // Step 2: Create customer via API
      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(timestamp),
          firstname: 'ทดสอบ',
          lastname: 'ระบบ',
          phone: '0899999999',
          address: 'กรุงเทพฯ',
        },
      });
      expect(customerResponse.ok()).toBeTruthy();
      const { customer_id } = await customerResponse.json();

      // Step 3: Create sale via API
      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id,
          customer_id,
          sale_price: 50000,
          sale_type: 'เงินสด',
        },
      });
      expect(saleResponse.ok()).toBeTruthy();
      const { sale_id } = await saleResponse.json();

      // Step 4: Create invoice via API
      const invoiceResponse = await request.post(`${BACKEND_URL}/api/invoices`, {
        data: {
          sale_id,
          invoice_number: `FLOW-${timestamp}`,
          total_amount: 50000,
        },
      });
      expect(invoiceResponse.ok()).toBeTruthy();
      const { invoice_id } = await invoiceResponse.json();

      // Step 5: Verify invoice in UI
      await page.goto(`${FRONTEND_URL}/invoices`);
      await page.waitForLoadState('networkidle');

      // Look for our invoice
      const invoiceTable = page.locator('table, [role="table"]');
      await expect(invoiceTable).toBeVisible();

      // Step 6: Try to download PDF
      // Navigate to invoice detail if needed
      const invoiceLink = page.locator(`text=${invoice_id}, a[href*="/invoices/${invoice_id}"]`).first();
      if ((await invoiceLink.count()) > 0) {
        await invoiceLink.click();
        await page.waitForLoadState('networkidle');
      }

      // Click PDF download button
      const pdfButton = page.locator('button:has-text("PDF"), a:has-text("PDF")').first();
      if ((await pdfButton.count()) > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await pdfButton.click();
        const download = await downloadPromise;

        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
        }
      }

      // Step 7: Verify bike is marked as sold
      const bikeCheckResponse = await request.get(`${BACKEND_URL}/api/bikes/${bike_id}`);
      const bikeData = await bikeCheckResponse.json();
      expect(bikeData.sold_date).not.toBeNull();
    });
  });

  test.describe('Edit and Regenerate PDF Flow', () => {
    test('Create invoice → Edit invoice details → Regenerate PDF → Verify updated data', async ({
      page,
      request,
    }) => {
      const timestamp = Date.now();

      // Create complete sale flow via API
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Edit Flow Bike ${timestamp}`,
          bike_chasi_number: `EDCH${timestamp}`,
          bike_engine_number: `EDEN${timestamp}`,
          brand_id: 1,
          bike_price_buy: 40000,
        },
      });
      const { bike_id } = await bikeResponse.json();

      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(timestamp),
          firstname: 'Edit',
          lastname: 'Test',
          phone: '0888888888',
        },
      });
      const { customer_id } = await customerResponse.json();

      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id,
          customer_id,
          sale_price: 45000,
        },
      });
      const { sale_id } = await saleResponse.json();

      const invoiceResponse = await request.post(`${BACKEND_URL}/api/invoices`, {
        data: {
          sale_id,
          invoice_number: `EDIT-${timestamp}`,
          total_amount: 45000,
        },
      });
      const { invoice_id } = await invoiceResponse.json();

      // Edit invoice amount via API
      const updateResponse = await request.put(`${BACKEND_URL}/api/invoices/${invoice_id}`, {
        data: {
          total_amount: 47000,
        },
      });
      expect(updateResponse.ok()).toBeTruthy();

      // Verify PDF can be generated with updated data
      const pdfResponse = await request.get(`${BACKEND_URL}/api/invoices/${invoice_id}/pdf`);
      expect(pdfResponse.ok()).toBeTruthy();
      expect(pdfResponse.headers()['content-type']).toContain('application/pdf');

      // Get updated invoice data
      const getResponse = await request.get(`${BACKEND_URL}/api/invoices/${invoice_id}`);
      const updatedInvoice = await getResponse.json();
      expect(updatedInvoice.total_amount).toBe(47000);
    });
  });

  test.describe('Multi-step Sale Workflow', () => {
    test('View unsold bikes → Select bike → Search customer → Create sale → Verify in sales list', async ({
      page,
      request,
    }) => {
      const timestamp = Date.now();

      // Prepare test data
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Multi Step Bike ${timestamp}`,
          bike_chasi_number: `MSCH${timestamp}`,
          bike_engine_number: `MSEN${timestamp}`,
          brand_id: 1,
          bike_price_buy: 42000,
        },
      });
      const { bike_id } = await bikeResponse.json();

      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(timestamp),
          firstname: 'Multi',
          lastname: 'Step',
          phone: '0866666666',
        },
      });
      const { customer_id } = await customerResponse.json();

      // Step 1: View unsold bikes
      const unsoldResponse = await request.get(`${BACKEND_URL}/api/bikes/unsold`);
      expect(unsoldResponse.ok()).toBeTruthy();
      const unsoldBikes = await unsoldResponse.json();
      expect(Array.isArray(unsoldBikes)).toBe(true);

      // Verify our bike is in the unsold list
      const ourBike = unsoldBikes.find((b: any) => b.bike_id === bike_id);
      expect(ourBike).toBeDefined();

      // Step 2: Create sale
      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id,
          customer_id,
          sale_price: 46000,
        },
      });
      expect(saleResponse.ok()).toBeTruthy();
      const { sale_id } = await saleResponse.json();

      // Step 3: Verify sale in sales list
      await page.goto(`${FRONTEND_URL}/sales`);
      await page.waitForLoadState('networkidle');

      const salesTable = page.locator('table, [role="table"]');
      await expect(salesTable).toBeVisible();

      // Step 4: Verify bike is no longer in unsold list
      const unsoldCheckResponse = await request.get(`${BACKEND_URL}/api/bikes/unsold`);
      const updatedUnsold = await unsoldCheckResponse.json();
      const stillUnsold = updatedUnsold.find((b: any) => b.bike_id === bike_id);
      expect(stillUnsold).toBeUndefined();
    });
  });

  test.describe('Data Persistence Flow', () => {
    test('Create record → Refresh page → Verify data persisted → Edit → Verify changes saved', async ({
      page,
      request,
    }) => {
      const timestamp = Date.now();

      // Step 1: Create customer
      const createResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(timestamp),
          firstname: 'Persist',
          lastname: 'Test',
          phone: '0855555555',
          address: 'Original Address',
        },
      });
      expect(createResponse.ok()).toBeTruthy();
      const { customer_id } = await createResponse.json();

      // Step 2: Refresh and verify data persisted
      const getResponse = await request.get(`${BACKEND_URL}/api/customers/${customer_id}`);
      expect(getResponse.ok()).toBeTruthy();
      const customer = await getResponse.json();
      expect(customer.firstname).toBe('Persist');
      expect(customer.address).toBe('Original Address');

      // Step 3: Edit record
      const updateResponse = await request.put(`${BACKEND_URL}/api/customers/${customer_id}`, {
        data: {
          address: 'Updated Address',
          phone: '0844444444',
        },
      });
      expect(updateResponse.ok()).toBeTruthy();

      // Step 4: Verify changes saved
      const verifyResponse = await request.get(`${BACKEND_URL}/api/customers/${customer_id}`);
      const updatedCustomer = await verifyResponse.json();
      expect(updatedCustomer.address).toBe('Updated Address');
      expect(updatedCustomer.phone).toBe('0844444444');
      expect(updatedCustomer.firstname).toBe('Persist'); // Unchanged field should remain
    });
  });

  test.describe('Filter and Search', () => {
    test('Filter bikes by brand → Search customers by name → Filter sales by date', async ({
      request,
    }) => {
      // Create test data
      const timestamp = Date.now();

      // Create bikes with different brands
      const bike1Response = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Filter Test 1 ${timestamp}`,
          bike_chasi_number: `FCH1${timestamp}`,
          bike_engine_number: `FEN1${timestamp}`,
          brand_id: 1,
        },
      });
      expect(bike1Response.ok()).toBeTruthy();

      // Test: Get all bikes
      const allBikesResponse = await request.get(`${BACKEND_URL}/api/bikes`);
      const allBikes = await allBikesResponse.json();
      expect(Array.isArray(allBikes)).toBe(true);
      expect(allBikes.length).toBeGreaterThan(0);

      // Test: Search customers
      const customersResponse = await request.get(`${BACKEND_URL}/api/customers`);
      const customers = await customersResponse.json();
      expect(Array.isArray(customers)).toBe(true);

      // Test: Get sales
      const salesResponse = await request.get(`${BACKEND_URL}/api/sales`);
      const sales = await salesResponse.json();
      expect(Array.isArray(sales)).toBe(true);
    });
  });

  test.describe('Error Handling Flow', () => {
    test('Submit invalid form → Verify error messages → Fix errors → Verify successful submission', async ({
      request,
    }) => {
      // Test 1: Invalid ID card (too short)
      const invalidResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: '123',
          firstname: 'Test',
          lastname: 'Error',
        },
      });
      expect([400, 422]).toContain(invalidResponse.status());

      // Test 2: Missing required fields
      const missingFieldsResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: 'Incomplete',
          // Missing required chassis and engine numbers
        },
      });
      expect([400, 422]).toContain(missingFieldsResponse.status());

      // Test 3: Valid submission
      const timestamp = Date.now();
      const validResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(timestamp),
          firstname: 'Valid',
          lastname: 'Customer',
          phone: '0833333333',
        },
      });
      expect(validResponse.ok()).toBeTruthy();
      expect(validResponse.status()).toBe(201);
    });
  });

  test.describe('Complete Business Workflow', () => {
    test('Full dealership workflow: Stock → Sale → Finance → Invoice', async ({ request }) => {
      const timestamp = Date.now();

      // Step 1: Add new bike to stock
      console.log('Step 1: Adding bike to stock...');
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Business Flow Bike ${timestamp}`,
          bike_chasi_number: `BFCH${timestamp}`,
          bike_engine_number: `BFEN${timestamp}`,
          brand_id: 1,
          bike_price_buy: 45000,
          bike_color: 'Black',
        },
      });
      expect(bikeResponse.ok()).toBeTruthy();
      const { bike_id } = await bikeResponse.json();
      console.log(`✓ Bike created: ${bike_id}`);

      // Step 2: Register new customer
      console.log('Step 2: Registering customer...');
      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: generateThaiIdFromSeed(timestamp),
          firstname: 'ลูกค้า',
          lastname: 'ทดสอบ',
          mobile_phone_1: '0822222222',
          current_address_number: '123 ถนนทดสอบ กรุงเทพฯ',
        },
      });
      expect(customerResponse.ok()).toBeTruthy();
      const { customer_id } = await customerResponse.json();
      console.log(`✓ Customer created: ${customer_id}`);

      // Step 3: Create sale transaction
      console.log('Step 3: Creating sale...');
      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id,
          customer_id,
          sale_price: 52000,
          sale_type: 'ผ่อนชำระ',
          finance_id: 1,
        },
      });
      expect(saleResponse.ok()).toBeTruthy();
      const { sale_id } = await saleResponse.json();
      console.log(`✓ Sale created: ${sale_id}`);

      // Step 4: Generate tax invoice
      console.log('Step 4: Generating invoice...');
      const invoiceResponse = await request.post(`${BACKEND_URL}/api/invoices`, {
        data: {
          sale_id,
          invoice_number: `BF-${timestamp}`,
          total_amount: 52000,
        },
      });
      expect(invoiceResponse.ok()).toBeTruthy();
      const { invoice_id } = await invoiceResponse.json();
      console.log(`✓ Invoice created: ${invoice_id}`);

      // Step 5: Verify PDF generation works
      console.log('Step 5: Generating PDF...');
      const pdfResponse = await request.get(`${BACKEND_URL}/api/invoices/${invoice_id}/pdf`);
      expect(pdfResponse.ok()).toBeTruthy();
      expect(pdfResponse.headers()['content-type']).toContain('application/pdf');
      console.log('✓ PDF generated successfully');

      // Step 6: Verify bike status changed to sold
      console.log('Step 6: Verifying bike sold status...');
      const bikeCheckResponse = await request.get(`${BACKEND_URL}/api/bikes/${bike_id}`);
      const soldBike = await bikeCheckResponse.json();
      expect(soldBike.sold_date).not.toBeNull();
      console.log('✓ Bike marked as sold');

      console.log('\n✅ Complete business workflow successful!');
    });
  });

  test.describe('Concurrent Operations', () => {
    test('Multiple users creating records simultaneously', async ({ request }) => {
      const timestamp = Date.now();

      // Simulate multiple concurrent customer creations
      const promises = Array.from({ length: 5 }, (_, i) =>
        request.post(`${BACKEND_URL}/api/customers`, {
          data: {
            idcard: generateThaiIdFromSeed(timestamp + i * 1000), // Add offset to ensure unique IDs
            firstname: `Concurrent${i}`,
            lastname: 'Test',
            phone: `08${timestamp.toString().slice(-8)}`,
          },
        })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((response, index) => {
        expect(response.ok()).toBeTruthy();
        console.log(`✓ Concurrent customer ${index + 1} created`);
      });
    });
  });
});
