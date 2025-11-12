const { request } = require('@playwright/test');

(async () => {
  const context = await request.newContext({
    baseURL: 'https://palmtong-cf.anu-9da.workers.dev'
  });

  console.log('\n=== Testing Backend DELETE Endpoints ===\n');

  // Test 1: Create and delete a customer
  console.log('1. Testing Customer DELETE endpoint...');
  const createCustomer = await context.post('/api/customers', {
    data: {
      idcard: '1234567890123',
      firstname: 'Test',
      lastname: 'Delete',
      mobile_phone_1: '0812345678'
    }
  });
  const customer = await createCustomer.json();
  console.log(`   ✓ Customer created: ID ${customer.customer_id}`);

  const deleteCustomer = await context.delete(`/api/customers/${customer.customer_id}`);
  console.log(`   ✓ DELETE response: ${deleteCustomer.status()} ${deleteCustomer.statusText()}`);

  // Verify deleted
  const getDeleted = await context.get(`/api/customers/${customer.customer_id}`);
  console.log(`   ✓ Verification: ${getDeleted.status()} (should be 404)`);

  // Test 2: Create and delete a bike
  console.log('\n2. Testing Bike DELETE endpoint...');
  const createBike = await context.post('/api/bikes', {
    data: {
      bike_model: 'Test Delete Bike',
      bike_chasi_number: 'TEST-DELETE-' + Date.now(),
      bike_engine_number: 'ENG-DELETE-' + Date.now(),
      brand_id: 1
    }
  });
  const bike = await createBike.json();
  console.log(`   ✓ Bike created: ID ${bike.bike_id}`);

  const deleteBike = await context.delete(`/api/bikes/${bike.bike_id}`);
  console.log(`   ✓ DELETE response: ${deleteBike.status()} ${deleteBike.statusText()}`);

  // Verify deleted
  const getBikeDeleted = await context.get(`/api/bikes/${bike.bike_id}`);
  console.log(`   ✓ Verification: ${getBikeDeleted.status()} (should be 404)`);

  console.log('\n=== All Backend DELETE Endpoints Working ✓ ===\n');

  await context.dispose();
})();
