import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anusoft.workers.dev';

test.describe('Backend API Integration Tests', () => {
  test.describe('Health and Infrastructure', () => {
    test('GET /api/health returns 200', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/health`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });
  });

  test.describe('Bikes API', () => {
    let createdBikeId: number;

    test('GET /api/bikes returns list', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/bikes`);
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('POST /api/bikes creates new bike', async ({ request }) => {
      const timestamp = Date.now();
      const response = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Honda Wave 125i Test ${timestamp}`,
          bike_chasi_number: `CHASSIS${timestamp}`,
          bike_engine_number: `ENGINE${timestamp}`,
          brand_id: 1,
          bike_color: 'Red',
          bike_price_buy: 45000,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('bike_id');
      createdBikeId = data.bike_id;
    });

    test('GET /api/bikes/:id returns bike details', async ({ request }) => {
      // First create a bike
      const timestamp = Date.now();
      const createResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Test Bike ${timestamp}`,
          bike_chasi_number: `CH${timestamp}`,
          bike_engine_number: `EN${timestamp}`,
          brand_id: 1,
        },
      });
      const { bike_id } = await createResponse.json();

      // Then get it
      const response = await request.get(`${BACKEND_URL}/api/bikes/${bike_id}`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.bike_id).toBe(bike_id);
      expect(data.bike_model).toContain('Test Bike');
    });

    test('PUT /api/bikes/:id updates bike', async ({ request }) => {
      // First create a bike
      const timestamp = Date.now();
      const createResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: 'Original Model',
          bike_chasi_number: `CH${timestamp}`,
          bike_engine_number: `EN${timestamp}`,
          brand_id: 1,
        },
      });
      const { bike_id } = await createResponse.json();

      // Update it
      const response = await request.put(`${BACKEND_URL}/api/bikes/${bike_id}`, {
        data: {
          bike_model: 'Updated Model',
          bike_color: 'Blue',
        },
      });

      expect(response.ok()).toBeTruthy();

      // Verify the update
      const getResponse = await request.get(`${BACKEND_URL}/api/bikes/${bike_id}`);
      const updatedData = await getResponse.json();
      expect(updatedData.bike_model).toBe('Updated Model');
    });

    test('GET /api/bikes/unsold returns only unsold bikes', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/bikes/unsold`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // Verify all bikes are unsold
      data.forEach((bike: any) => {
        expect(bike.sold_date).toBeNull();
      });
    });
  });

  test.describe('Customers API', () => {
    test('GET /api/customers returns list', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/customers`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('POST /api/customers creates customer with Thai name', async ({ request }) => {
      const timestamp = Date.now();
      const response = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: `${timestamp}`.padStart(13, '1'),
          firstname: 'สมชาย',
          lastname: 'ใจดี',
          phone: '0812345678',
          address: 'กรุงเทพมหานคร',
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('customer_id');
      expect(data.firstname).toBe('สมชาย');
    });

    test('PUT /api/customers/:id updates customer', async ({ request }) => {
      // Create customer
      const timestamp = Date.now();
      const createResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: `${timestamp}`.padStart(13, '2'),
          firstname: 'Original',
          lastname: 'Name',
          phone: '0898765432',
        },
      });
      const { customer_id } = await createResponse.json();

      // Update customer
      const response = await request.put(`${BACKEND_URL}/api/customers/${customer_id}`, {
        data: {
          firstname: 'Updated',
          lastname: 'Customer',
        },
      });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Brands API', () => {
    test('GET /api/brands returns list', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/brands`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test('POST /api/brands creates brand', async ({ request }) => {
      const timestamp = Date.now();
      const response = await request.post(`${BACKEND_URL}/api/brands`, {
        data: {
          brand_name_english: `Test Brand ${timestamp}`,
          brand_name_thai: `แบรนด์ทดสอบ ${timestamp}`,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('brand_id');
    });
  });

  test.describe('Suppliers API', () => {
    test('GET /api/suppliers returns list', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/suppliers`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('POST /api/suppliers creates supplier', async ({ request }) => {
      const timestamp = Date.now();
      const response = await request.post(`${BACKEND_URL}/api/suppliers`, {
        data: {
          nickname: `TestSupplier${timestamp}`,
          fullname: `Test Supplier Full Name ${timestamp}`,
          phone: '0812345678',
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('suplier_id'); // Note: typo in schema
    });
  });

  test.describe('Sales API', () => {
    test('GET /api/sales returns list', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/sales`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('POST /api/sales creates sale (links bike + customer)', async ({ request }) => {
      // Create bike
      const timestamp = Date.now();
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Sale Test Bike ${timestamp}`,
          bike_chasi_number: `SCH${timestamp}`,
          bike_engine_number: `SEN${timestamp}`,
          brand_id: 1,
          bike_price_buy: 45000,
        },
      });
      const { bike_id } = await bikeResponse.json();

      // Create customer
      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: `${timestamp}`.padStart(13, '3'),
          firstname: 'Test',
          lastname: 'Buyer',
          phone: '0898765432',
        },
      });
      const { customer_id } = await customerResponse.json();

      // Create sale
      const response = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id,
          customer_id,
          sale_price: 50000,
          sale_type: 'เงินสด',
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('sale_id');
    });

    test('GET /api/sales/:id returns sale details', async ({ request }) => {
      // Create test sale first
      const timestamp = Date.now();

      // Create bike
      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Detail Test Bike ${timestamp}`,
          bike_chasi_number: `DCH${timestamp}`,
          bike_engine_number: `DEN${timestamp}`,
          brand_id: 1,
          bike_price_buy: 45000,
        },
      });
      const { bike_id } = await bikeResponse.json();

      // Create customer
      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: `${timestamp}`.padStart(13, '4'),
          firstname: 'Detail',
          lastname: 'Test',
          phone: '0811111111',
        },
      });
      const { customer_id } = await customerResponse.json();

      // Create sale
      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id,
          customer_id,
          sale_price: 48000,
        },
      });
      const { sale_id } = await saleResponse.json();

      // Get sale details
      const response = await request.get(`${BACKEND_URL}/api/sales/${sale_id}`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.sale_id).toBe(sale_id);
      expect(data.bike_id).toBe(bike_id);
      expect(data.customer_id).toBe(customer_id);
    });
  });

  test.describe('Invoices API', () => {
    test('GET /api/invoices returns list', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/invoices`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('POST /api/invoices creates invoice from sale', async ({ request }) => {
      // Create complete sale flow
      const timestamp = Date.now();

      const bikeResponse = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          bike_model: `Invoice Test Bike ${timestamp}`,
          bike_chasi_number: `ICH${timestamp}`,
          bike_engine_number: `IEN${timestamp}`,
          brand_id: 1,
          bike_price_buy: 45000,
        },
      });
      const { bike_id } = await bikeResponse.json();

      const customerResponse = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: `${timestamp}`.padStart(13, '5'),
          firstname: 'Invoice',
          lastname: 'Test',
          phone: '0822222222',
        },
      });
      const { customer_id } = await customerResponse.json();

      const saleResponse = await request.post(`${BACKEND_URL}/api/sales`, {
        data: {
          bike_id,
          customer_id,
          sale_price: 52000,
        },
      });
      const { sale_id } = await saleResponse.json();

      // Create invoice
      const response = await request.post(`${BACKEND_URL}/api/invoices`, {
        data: {
          sale_id,
          invoice_number: `INV-${timestamp}`,
          total_amount: 52000,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('invoice_id');
    });
  });

  test.describe('Error Handling', () => {
    test('Returns 404 for non-existent bike', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/bikes/999999`);
      expect(response.status()).toBe(404);
    });

    test('Returns 400 for invalid bike data', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {
          // Missing required fields
          bike_model: 'Incomplete',
        },
      });
      expect([400, 422]).toContain(response.status());
    });

    test('Returns 400 for invalid customer idcard', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: '123', // Too short
          firstname: 'Test',
          lastname: 'Test',
        },
      });
      expect([400, 422]).toContain(response.status());
    });
  });

  test.describe('Data Validation', () => {
    test('Validates required fields for bikes', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/bikes`, {
        data: {},
      });
      expect([400, 422]).toContain(response.status());
    });

    test('Validates Thai ID card format', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/api/customers`, {
        data: {
          idcard: 'invalid',
          firstname: 'Test',
          lastname: 'Test',
        },
      });
      expect([400, 422]).toContain(response.status());
    });
  });
});
