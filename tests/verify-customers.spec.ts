import { test, expect } from '@playwright/test'

const FRONTEND_URL = 'https://fd035ed7.palmtong-frontend.pages.dev'
const BACKEND_URL = 'https://palmtong-backend.anu-9da.workers.dev'

test.describe('Customers Page Verification', () => {
  test('Backend API returns customer data with correct field names', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/customers?rows=5`)
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('rows')
    expect(data.rows.length).toBeGreaterThan(0)
    
    const firstCustomer = data.rows[0]
    console.log('First customer from API:', JSON.stringify(firstCustomer, null, 2))
    
    expect(firstCustomer).toHaveProperty('customer_id')
    expect(firstCustomer).toHaveProperty('firstname')
    expect(firstCustomer).toHaveProperty('lastname')
    expect(firstCustomer).toHaveProperty('mobile_phone_1')
  })

  test('Frontend customers page displays data correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`)
    await page.waitForLoadState('networkidle')
    
    // Wait for the table to load
    await page.waitForSelector('table', { timeout: 10000 })
    
    // Check if there are customer rows
    const rows = await page.locator('tbody tr').count()
    console.log(`Found ${rows} customer rows`)
    expect(rows).toBeGreaterThan(0)
    
    // Get the first row's data
    const firstRow = page.locator('tbody tr').first()
    const cells = await firstRow.locator('td').allTextContents()
    console.log('First row cells:', cells)
    
    // Cells should be: [ID, IDCard, FirstName, LastName, Phone, Created, Actions]
    expect(cells.length).toBeGreaterThanOrEqual(7)
    
    // Check that firstname (index 2) and lastname (index 3) are not empty
    expect(cells[2].trim()).not.toBe('')
    expect(cells[3].trim()).not.toBe('')
  })
})
