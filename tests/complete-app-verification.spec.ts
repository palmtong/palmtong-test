import { test, expect } from '@playwright/test'

const FRONTEND_URL = 'https://6e8fee5a.palmtong-frontend.pages.dev'
const BACKEND_URL = 'https://palmtong-backend.anu-9da.workers.dev'

test.describe('Complete Application Verification - All Pages', () => {

  test('Dashboard - displays all summary cards with data', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}`)
    await page.waitForLoadState('networkidle')

    // Check page title
    await expect(page.getByRole('heading', { name: /หน้าหลัก/i })).toBeVisible()

    // Check summary cards exist
    const cards = page.locator('.rounded-lg, [class*="card"]')
    const cardCount = await cards.count()
    console.log(`Dashboard: Found ${cardCount} summary cards`)
    expect(cardCount).toBeGreaterThan(0)

    // Verify cards have content (not empty)
    const cardTexts = await cards.allTextContents()
    cardTexts.forEach((text, index) => {
      console.log(`Card ${index + 1}: ${text.substring(0, 50)}...`)
      expect(text.trim()).not.toBe('')
    })
  })

  test('Customers page - all fields display correctly', async ({ page, request }) => {
    // Verify API data first
    const apiResponse = await request.get(`${BACKEND_URL}/api/customers?rows=10`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    expect(apiData.rows.length).toBeGreaterThan(0)

    console.log('API Sample Customer:', {
      id: apiData.rows[0].customer_id,
      firstname: apiData.rows[0].firstname,
      lastname: apiData.rows[0].lastname,
      idcard: apiData.rows[0].idcard,
      mobile: apiData.rows[0].mobile_phone_1
    })

    // Navigate to page
    await page.goto(`${FRONTEND_URL}/customers`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('table', { timeout: 10000 })

    // Verify header
    await expect(page.getByRole('heading', { name: /ลูกค้า/i })).toBeVisible()

    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    expect(headers).toContain('รหัส')
    expect(headers).toContain('เลขบัตรประชาชน')
    expect(headers).toContain('ชื่อ')
    expect(headers).toContain('นามสกุล')

    // Verify rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Customers: ${rowCount} rows displayed`)
    expect(rowCount).toBeGreaterThan(0)

    // Check first 3 rows have data in all columns
    for (let i = 0; i < Math.min(3, rowCount); i++) {
      const row = page.locator('tbody tr').nth(i)
      const cells = await row.locator('td').allTextContents()
      console.log(`Row ${i + 1}:`, {
        id: cells[0],
        idcard: cells[1],
        firstname: cells[2],
        lastname: cells[3]
      })

      expect(cells[0].trim()).not.toBe('') // ID
      expect(cells[1].trim()).not.toBe('') // IDCard
      expect(cells[2].trim()).not.toBe('') // FirstName
      expect(cells[3].trim()).not.toBe('') // LastName
    }
  })

  test('Sales page - all transaction data displays', async ({ page, request }) => {
    // Verify API
    const apiResponse = await request.get(`${BACKEND_URL}/api/sales?rows=10`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()

    console.log('API Sample Sale:', {
      id: apiData.rows[0].sale_id,
      customer: `${apiData.rows[0].customer_firstname} ${apiData.rows[0].customer_lastname}`,
      bike: apiData.rows[0].bike_chasi_number,
      total: apiData.rows[0].sale_total
    })

    // Navigate to page
    await page.goto(`${FRONTEND_URL}/sales`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('table', { timeout: 10000 })

    // Verify header
    await expect(page.getByRole('heading', { name: /ขายออก/i })).toBeVisible()

    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Sales headers:', headers)

    // Verify rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Sales: ${rowCount} rows displayed`)
    expect(rowCount).toBeGreaterThan(0)

    // Check first 3 rows
    for (let i = 0; i < Math.min(3, rowCount); i++) {
      const row = page.locator('tbody tr').nth(i)
      const cells = await row.locator('td').allTextContents()
      console.log(`Sale ${i + 1}:`, {
        id: cells[0],
        date: cells[1],
        customer: cells[2],
        bike: cells[3]
      })

      expect(cells[0].trim()).not.toBe('') // ID
      expect(cells[1].trim()).not.toBe('') // Date
      expect(cells[2].trim()).not.toBe('') // Customer name MUST show
    }
  })

  test('Invoices page - all invoice data displays', async ({ page, request }) => {
    // Verify API
    const apiResponse = await request.get(`${BACKEND_URL}/api/invoices?rows=10`)
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()

    console.log('API Sample Invoice:', {
      id: apiData.rows[0].invoice_id,
      date: apiData.rows[0].invoice_date,
      buyer: apiData.rows[0].buyer_name,
      total: apiData.rows[0].invoice_total
    })

    // Navigate to page
    await page.goto(`${FRONTEND_URL}/invoices`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('table', { timeout: 10000 })

    // Verify header
    await expect(page.getByRole('heading', { name: /ใบกำกับภาษี/i })).toBeVisible()

    // Verify table headers
    const headers = await page.locator('thead th').allTextContents()
    console.log('Invoice headers:', headers)

    // Verify rows
    const rowCount = await page.locator('tbody tr').count()
    console.log(`Invoices: ${rowCount} rows displayed`)
    expect(rowCount).toBeGreaterThan(0)

    // Check first 3 rows
    for (let i = 0; i < Math.min(3, rowCount); i++) {
      const row = page.locator('tbody tr').nth(i)
      const cells = await row.locator('td').allTextContents()
      console.log(`Invoice ${i + 1}:`, {
        number: cells[0],
        date: cells[1],
        buyer: cells[2],
        total: cells[5]
      })

      expect(cells[1].trim()).not.toBe('') // Date
      expect(cells[2].trim()).not.toBe('') // Buyer name
      expect(cells[5].trim()).not.toBe('') // Total amount
    }
  })

  test('All pages with tables display data', async ({ page }) => {
    const pages = [
      { url: '/customers', name: 'Customers' },
      { url: '/sales', name: 'Sales' },
      { url: '/invoices', name: 'Invoices' },
      { url: '/brands', name: 'Brands' },
      { url: '/suppliers', name: 'Suppliers' },
      { url: '/finance', name: 'Finance' }
    ]

    for (const pageInfo of pages) {
      await page.goto(`${FRONTEND_URL}${pageInfo.url}`)
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('table', { timeout: 10000 })

      const rowCount = await page.locator('tbody tr').count()
      console.log(`${pageInfo.name}: ${rowCount} rows`)
      expect(rowCount).toBeGreaterThan(0)
    }
  })
})

test.describe('Data Integrity Checks', () => {

  test('No empty critical fields in customers', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/customers`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('table')

    const rows = await page.locator('tbody tr').count()
    let emptyFields = 0

    for (let i = 0; i < Math.min(10, rows); i++) {
      const row = page.locator('tbody tr').nth(i)
      const cells = await row.locator('td').allTextContents()

      // Check critical fields (ID, IDCard, FirstName, LastName)
      if (!cells[0].trim() || !cells[1].trim() || !cells[2].trim() || !cells[3].trim()) {
        emptyFields++
        console.log(`⚠️ Row ${i + 1} has empty critical field:`, cells.slice(0, 4))
      }
    }

    expect(emptyFields).toBe(0)
    console.log(`✓ All ${Math.min(10, rows)} customer rows have complete data`)
  })

  test('Thai language displays correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}`)
    await page.waitForLoadState('networkidle')

    // Check for Thai text
    const bodyText = await page.locator('body').textContent()
    const hasThaiText = /[ก-๙]/.test(bodyText || '')

    expect(hasThaiText).toBeTruthy()
    console.log('✓ Thai language characters detected')
  })

  test('Currency formatting - displays ฿ symbol', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/sales`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('table')

    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toContain('฿')
    console.log('✓ Thai Baht currency symbol displays correctly')
  })
})
