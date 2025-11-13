import { test, expect } from '@playwright/test'

const FRONTEND_URL = "https://a1f71887.palmtong-frontend.pages.dev"
const BACKEND_URL = 'https://palmtong-backend.anu-9da.workers.dev'

test.describe('All Tables Verification - Complete Application', () => {
  
  test('Dashboard page loads and displays summary cards', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}`)
    await page.waitForLoadState('networkidle')
    
    // Check for dashboard title
    await expect(page.getByRole('heading', { name: /หน้าหลัก|Dashboard/i })).toBeVisible()
    
    // Dashboard should show summary cards with data
    const cardTexts = await page.locator('[class*="card"], .rounded-lg').allTextContents()
    console.log('Dashboard cards:', cardTexts.length)
    expect(cardTexts.length).toBeGreaterThan(0)
  })

  test('Customers page - table displays all customer data', async ({ page, request }) => {
    // First, verify API returns data
    const apiResponse = await request.get(`${BACKEND_URL}/api/customers?rows=5`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    expect(apiData.rows.length).toBeGreaterThan(0)
    
    const firstCustomer = apiData.rows[0]
    console.log('API First Customer:', {
      id: firstCustomer.customer_id,
      firstname: firstCustomer.firstname,
      lastname: firstCustomer.lastname,
      idcard: firstCustomer.idcard
    })
    
    // Navigate to customers page
    await page.goto(`${FRONTEND_URL}/customers`)
    await page.waitForLoadState('networkidle')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Customers table headers:', headers)
    expect(headers.length).toBeGreaterThanOrEqual(7) // ID, IDCard, FirstName, LastName, Phone, Created, Actions
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Customers: Found ${rowCount} rows`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has data in all columns
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('Customers first row:', cells)
    
    // Check critical columns are not empty (ID, IDCard, FirstName, LastName)
    expect(cells[0].trim()).not.toBe('') // ID
    expect(cells[1].trim()).not.toBe('') // IDCard
    expect(cells[2].trim()).not.toBe('') // FirstName
    expect(cells[3].trim()).not.toBe('') // LastName
  })

  test('Bikes/Inventory page - table displays all bike data', async ({ page, request }) => {
    // Verify API returns data
    const apiResponse = await request.get(`${BACKEND_URL}/api/bikes/unsold?rows=5`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    
    if (apiData.rows && apiData.rows.length > 0) {
      const firstBike = apiData.rows[0]
      console.log('API First Bike:', {
        id: firstBike.bike_id,
        brand: firstBike.brand_name_english,
        model: firstBike.bike_model,
        chassis: firstBike.bike_chasi_number
      })
    }
    
    // Navigate to bikes page
    await page.goto(`${FRONTEND_URL}/bikes`)
    await page.waitForLoadState('networkidle')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Bikes table headers:', headers)
    expect(headers.length).toBeGreaterThanOrEqual(6) // ID, Brand, Model, Chassis, Engine, Actions
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Bikes: Found ${rowCount} rows`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has data
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('Bikes first row:', cells)
    
    // Check critical columns are not empty
    expect(cells[0].trim()).not.toBe('') // ID
    expect(cells[1].trim()).not.toBe('') // Brand/Model
  })

  test('Sales page - table displays all sales data', async ({ page, request }) => {
    // Verify API returns data
    const apiResponse = await request.get(`${BACKEND_URL}/api/sales?rows=5`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    
    if (apiData.rows && apiData.rows.length > 0) {
      const firstSale = apiData.rows[0]
      console.log('API First Sale:', {
        id: firstSale.sale_id,
        customer: `${firstSale.firstname} ${firstSale.lastname}`,
        bike: firstSale.bike_chasi_number,
        total: firstSale.sale_total
      })
    }
    
    // Navigate to sales page
    await page.goto(`${FRONTEND_URL}/sales`)
    await page.waitForLoadState('networkidle')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Sales table headers:', headers)
    expect(headers.length).toBeGreaterThanOrEqual(6)
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Sales: Found ${rowCount} rows`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has data
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('Sales first row:', cells)
    
    // Check critical columns
    expect(cells[0].trim()).not.toBe('') // ID
    expect(cells[2].trim()).not.toBe('') // Customer name should not be empty
  })

  test('Invoices page - table displays all invoice data', async ({ page, request }) => {
    // Verify API returns data
    const apiResponse = await request.get(`${BACKEND_URL}/api/invoices?rows=5`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    
    if (apiData.rows && apiData.rows.length > 0) {
      const firstInvoice = apiData.rows[0]
      console.log('API First Invoice:', {
        id: firstInvoice.invoice_id,
        number: firstInvoice.invoice_number,
        buyer: firstInvoice.invoice_buyer_name,
        total: firstInvoice.invoice_grand_total
      })
    }
    
    // Navigate to invoices page
    await page.goto(`${FRONTEND_URL}/invoices`)
    await page.waitForLoadState('networkidle')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Invoices table headers:', headers)
    expect(headers.length).toBeGreaterThanOrEqual(6)
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Invoices: Found ${rowCount} rows`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has data
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('Invoices first row:', cells)
    
    // Check critical columns
    expect(cells[0].trim()).not.toBe('') // ID
    expect(cells[1].trim()).not.toBe('') // Invoice number
  })

  test('Brands page - table displays all brand data', async ({ page, request }) => {
    // Verify API returns data
    const apiResponse = await request.get(`${BACKEND_URL}/api/brands?rows=5`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    
    if (apiData.rows && apiData.rows.length > 0) {
      const firstBrand = apiData.rows[0]
      console.log('API First Brand:', {
        id: firstBrand.brand_id,
        name_thai: firstBrand.brand_name_thai,
        name_english: firstBrand.brand_name_english
      })
    }
    
    // Navigate to brands page
    await page.goto(`${FRONTEND_URL}/brands`)
    await page.waitForLoadState('networkidle')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Brands table headers:', headers)
    expect(headers.length).toBeGreaterThanOrEqual(4)
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Brands: Found ${rowCount} rows`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has data
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('Brands first row:', cells)
    
    // Check critical columns
    expect(cells[0].trim()).not.toBe('') // ID
    expect(cells[1].trim()).not.toBe('') // Brand name
  })

  test('Suppliers page - table displays all supplier data', async ({ page, request }) => {
    // Verify API returns data
    const apiResponse = await request.get(`${BACKEND_URL}/api/suppliers?rows=5`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    
    if (apiData.rows && apiData.rows.length > 0) {
      const firstSupplier = apiData.rows[0]
      console.log('API First Supplier:', {
        id: firstSupplier.suplier_id,
        name: firstSupplier.suplier_name
      })
    }
    
    // Navigate to suppliers page
    await page.goto(`${FRONTEND_URL}/suppliers`)
    await page.waitForLoadState('networkidle')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Suppliers table headers:', headers)
    expect(headers.length).toBeGreaterThanOrEqual(4)
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Suppliers: Found ${rowCount} rows`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has data
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('Suppliers first row:', cells)
    
    // Check critical columns
    expect(cells[0].trim()).not.toBe('') // ID
    expect(cells[1].trim()).not.toBe('') // Supplier name
  })

  test('Finance page - table displays all finance company data', async ({ page, request }) => {
    // Verify API returns data
    const apiResponse = await request.get(`${BACKEND_URL}/api/finance?rows=5`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    
    if (apiData.rows && apiData.rows.length > 0) {
      const firstFinance = apiData.rows[0]
      console.log('API First Finance:', {
        id: firstFinance.finance_id,
        nickname: firstFinance.nickname,
        name: firstFinance.name
      })
    }
    
    // Navigate to finance page
    await page.goto(`${FRONTEND_URL}/finance`)
    await page.waitForLoadState('networkidle')
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Finance table headers:', headers)
    expect(headers.length).toBeGreaterThanOrEqual(4)
    
    // Verify table has rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Finance: Found ${rowCount} rows`)
    expect(rowCount).toBeGreaterThan(0)
    
    // Verify first row has data
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('Finance first row:', cells)
    
    // Check critical columns
    expect(cells[0].trim()).not.toBe('') // ID
    expect(cells[1].trim()).not.toBe('') // Nickname or Name
  })
})

test.describe('Cross-page Navigation Verification', () => {
  test('All navigation links work and tables load', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}`)
    await page.waitForLoadState('networkidle')
    
    const pages = [
      { name: 'ลูกค้า', url: '/customers' },
      { name: 'ซื้อเข้า', url: '/bikes' },
      { name: 'ขายออก', url: '/sales' },
      { name: 'ใบกำกับภาษี', url: '/invoices' },
      { name: 'ยี่ห้อรถ', url: '/brands' },
      { name: 'ผู้จัดจำหน่าย', url: '/suppliers' },
      { name: 'บริษัทไฟแนนซ์', url: '/finance' },
    ]
    
    for (const pageInfo of pages) {
      console.log(`\nTesting navigation to: ${pageInfo.name}`)
      
      // Click on navigation link
      const navLink = page.getByRole('link', { name: new RegExp(pageInfo.name, 'i') }).first()
      await navLink.click()
      await page.waitForLoadState('networkidle')
      
      // Verify URL changed
      expect(page.url()).toContain(pageInfo.url)
      
      // Verify table exists (except dashboard which might not have a table)
      if (pageInfo.url !== '/') {
        await page.waitForSelector('table', { timeout: 10000 })
        const tableExists = await page.locator('table').count()
        expect(tableExists).toBeGreaterThan(0)
        console.log(`✓ ${pageInfo.name} - Table found`)
      }
    }
  })
})
