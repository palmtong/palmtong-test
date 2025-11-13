/**
 * DataTable Component Integration Tests
 *
 * Tests the enhanced DataTable component features:
 * - Remote pagination with page size selector
 * - Column sorting (ascending/descending)
 * - Debounced search/filtering
 * - Clear filters functionality
 * - Loading states
 * - Empty states
 *
 * All table pages use the same DataTable component, so we test one page thoroughly.
 */

import { test, expect } from '@playwright/test'

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://palmtong-frontend.pages.dev'
const BACKEND_URL = process.env.BACKEND_URL || 'https://palmtong-backend.anu-9da.workers.dev'

test.describe('DataTable Component Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Customers page (representative of all table pages)
    await page.goto(`${FRONTEND_URL}/customers`)

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('should display DataTable with default pagination', async ({ page }) => {
    // Check that table is rendered
    await expect(page.locator('table')).toBeVisible()

    // Check default page size selector shows 10
    const pageSizeSelector = page.locator('select').first()
    await expect(pageSizeSelector).toBeVisible()
    await expect(pageSizeSelector).toHaveValue('10')

    // Check pagination info is shown
    const paginationInfo = page.locator('text=/แสดง.*รายการ/').first()
    await expect(paginationInfo).toBeVisible()

    // Check pagination controls exist
    await expect(page.locator('button:has-text("<<")')).toBeVisible() // First page
    await expect(page.locator('button:has-text("<")')).toBeVisible() // Previous
    await expect(page.locator('button:has-text(">")')).toBeVisible() // Next
    await expect(page.locator('button:has-text(">>")')).toBeVisible() // Last page
  })

  test('should change page size and update table', async ({ page }) => {
    // Wait for initial data to load
    await page.waitForSelector('table tbody tr')

    // Count initial rows (should be 10)
    const initialRows = await page.locator('table tbody tr').count()
    expect(initialRows).toBeLessThanOrEqual(10)

    // Change page size to 20
    const pageSizeSelector = page.locator('select').first()
    await pageSizeSelector.selectOption('20')

    // Wait for new data to load
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    // Verify selector updated
    await expect(pageSizeSelector).toHaveValue('20')

    // Count rows again (should be up to 20)
    const newRows = await page.locator('table tbody tr').count()
    expect(newRows).toBeGreaterThan(initialRows)
    expect(newRows).toBeLessThanOrEqual(20)
  })

  test('should sort table columns', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr')

    // Find sortable column header (e.g., "รหัส" / ID)
    const idHeader = page.locator('th').filter({ hasText: 'รหัส' }).first()

    // Check initial sort indicator (default is DESC for customer_id)
    const initialSortIcon = await idHeader.locator('span').textContent()
    expect(initialSortIcon).toMatch(/[↕↑↓]/)

    // Get initial first ID
    const initialFirstId = await page.locator('table tbody tr:first-child td:first-child').textContent()

    // Click to toggle sort
    await idHeader.click()
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    // Verify sort indicator changed (should be one of the sort arrows)
    const newSortIcon = await idHeader.locator('span').textContent()
    expect(newSortIcon).toMatch(/[↑↓]/)

    // Get new first ID value
    const newFirstId = await page.locator('table tbody tr:first-child td:first-child').textContent()

    // Click again to toggle sort direction
    await idHeader.click()
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    // Verify sort indicator changed again
    const finalSortIcon = await idHeader.locator('span').textContent()
    expect(finalSortIcon).toMatch(/[↑↓]/)
    expect(finalSortIcon).not.toBe(newSortIcon)

    // Get final first ID
    const finalFirstId = await page.locator('table tbody tr:first-child td:first-child').textContent()

    // First IDs should be different after sorting changes
    expect(newFirstId).not.toBe(finalFirstId)
  })

  test('should display filter inputs for each column', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('table')

    // Check that filter section exists
    const filterSection = page.locator('div:has-text("ค้นหา")').first()
    await expect(filterSection).toBeVisible()

    // Check that filter inputs exist
    // Customers table has: รหัส, เลขบัตรประชาชน, ชื่อ, นามสกุล, เบอร์โทรศัพท์
    const filterInputs = page.locator('input[placeholder*="ค้นหา"]')
    const inputCount = await filterInputs.count()

    // Should have at least 4 filter inputs (ID might be excluded)
    expect(inputCount).toBeGreaterThanOrEqual(4)

    // Verify filter labels exist
    await expect(page.locator('label:has-text("เลขบัตรประชาชน")')).toBeVisible()
    await expect(page.locator('label:has-text("ชื่อ")')).toBeVisible()
    await expect(page.locator('label:has-text("นามสกุล")')).toBeVisible()
  })

  test('should filter data with debounced search', async ({ page }) => {
    // Wait for initial data
    await page.waitForSelector('table tbody tr')
    const initialRowCount = await page.locator('table tbody tr').count()

    // Find the ID card filter input
    const idcardFilter = page.locator('label:has-text("เลขบัตรประชาชน")').locator('..').locator('input')

    // Type search query for a common digit (1) that appears in many ID cards
    await idcardFilter.fill('1')

    // Wait for debounce delay (500ms) + network request
    await page.waitForTimeout(700)
    await page.waitForLoadState('networkidle')

    // Verify data is filtered
    const filteredRowCount = await page.locator('table tbody tr').count()

    // Should have results (many ID cards contain "1")
    expect(filteredRowCount).toBeGreaterThan(0)

    // If we have results, verify the filter worked by checking first row has "1" in ID card
    if (filteredRowCount > 0) {
      const firstRow = page.locator('table tbody tr:first-child')
      await expect(firstRow).toContainText('1')
    }
  })

  test('should show and use clear filters button', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('table tbody tr')

    // Initially, clear filters button should not be visible
    const clearButton = page.locator('button:has-text("รีเซ็ต")').first()

    // Apply a filter
    const lastnameFilter = page.locator('label:has-text("นามสกุล")').locator('..').locator('input')
    await lastnameFilter.fill('Test')

    // Wait for filter to apply
    await page.waitForTimeout(700)

    // Now clear button should be visible
    await expect(clearButton).toBeVisible()

    // Click clear filters button
    await clearButton.click()

    // Verify filter input is cleared
    await expect(lastnameFilter).toHaveValue('')

    // Wait for data to reload
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')
  })

  test('should navigate between pages', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr')

    // Get current page info
    const pageInfo = page.locator('text=/หน้า.*จาก/').first()
    await expect(pageInfo).toBeVisible()

    // Check we're on page 1
    const page1Text = await pageInfo.textContent()
    expect(page1Text).toContain('หน้า 1')

    // Get all pagination buttons (should have 4: <<, <, >, >>)
    const paginationButtons = page.locator('button').filter({ has: page.locator('svg') })
    const buttonCount = await paginationButtons.count()

    // Next button should be the 3rd button (index 2) in pagination
    // Buttons order: [<< (first)] [< (prev)] [> (next)] [>> (last)]
    if (buttonCount >= 3) {
      const nextButton = paginationButtons.nth(2)
      await nextButton.click()

      // Wait for navigation
      await page.waitForTimeout(500)
      await page.waitForLoadState('networkidle')

      // Verify page changed from page 1
      const page2Text = await pageInfo.textContent()
      expect(page2Text).not.toContain('หน้า 1 จาก')

      // Click previous button (2nd button, index 1)
      const prevButton = paginationButtons.nth(1)
      await prevButton.click()

      // Wait for navigation
      await page.waitForTimeout(500)
      await page.waitForLoadState('networkidle')

      // Verify we're back on page 1
      const finalPageText = await pageInfo.textContent()
      expect(finalPageText).toContain('หน้า 1')
    } else {
      // Skip test if not enough pagination buttons (single page)
      console.log('Skipping pagination test - not enough pages')
    }
  })

  test('should show loading state', async ({ page }) => {
    // Intercept API request to add delay
    await page.route('**/api/customers*', async route => {
      await page.waitForTimeout(1000)
      await route.continue()
    })

    // Navigate to page
    await page.goto(`${FRONTEND_URL}/customers`)

    // Should show loading spinner or loading text
    const loadingIndicator = page.locator('text=กำลังโหลด')
    await expect(loadingIndicator).toBeVisible()

    // Wait for loading to complete
    await page.waitForLoadState('networkidle')

    // Loading should be gone
    await expect(loadingIndicator).not.toBeVisible()
  })

  test('should show empty state with no results', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr')

    // Apply filter that returns no results
    const idcardFilter = page.locator('label:has-text("เลขบัตรประชาชน")').locator('..').locator('input')
    await idcardFilter.fill('9999999999999')

    // Wait for filter to apply
    await page.waitForTimeout(700)
    await page.waitForLoadState('networkidle')

    // Should show "no results" message
    const noResultsMessage = page.locator('text=ไม่พบผลลัพธ์')
    await expect(noResultsMessage).toBeVisible()

    // Should show clear filters button in empty state
    const clearButton = page.locator('button:has-text("รีเซ็ต")')
    const clearButtonCount = await clearButton.count()
    expect(clearButtonCount).toBeGreaterThan(0)
  })

  test('should work on all table pages', async ({ page }) => {
    const tablePaths = [
      '/customers',
      '/bikes',
      '/brands',
      '/suppliers',
      '/finance',
      '/sales',
      '/invoices'
    ]

    for (const path of tablePaths) {
      // Navigate to page
      await page.goto(`${FRONTEND_URL}${path}`)
      await page.waitForLoadState('networkidle')

      // Verify DataTable components exist
      await expect(page.locator('table')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('select').first()).toBeVisible() // Page size selector

      // Verify pagination exists (if data available)
      const rowCount = await page.locator('table tbody tr').count()
      if (rowCount > 0) {
        await expect(page.locator('text=/แสดง.*รายการ/')).toBeVisible()
      }
    }
  })

  test('should persist page size selection across pages', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr')

    // Change page size to 50
    const pageSizeSelector = page.locator('select').first()
    await pageSizeSelector.selectOption('50')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    // Verify page size is updated
    await expect(pageSizeSelector).toHaveValue('50')

    // Check that we're showing up to 50 records on first page
    const initialPaginationInfo = await page.locator('text=/แสดง.*รายการ/').first().textContent()
    expect(initialPaginationInfo).toMatch(/แสดง \d+ - \d+/)

    // Navigate to next page using the second to last button (not last which is >>)
    const nextButton = page.getByRole('button').filter({ hasText: 'ถัดไป' })
    await nextButton.click()
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    // Verify page size is still 50 after navigation
    await expect(pageSizeSelector).toHaveValue('50')

    // Verify we're on a different page
    const newPaginationInfo = await page.locator('text=/แสดง.*รายการ/').first().textContent()
    expect(newPaginationInfo).not.toBe(initialPaginationInfo)
  })
})

test.describe('DataTable Backend Integration', () => {
  test('should send correct API parameters for pagination', async ({ page }) => {
    let apiRequest: any = null

    // Capture API request
    page.on('request', request => {
      if (request.url().includes('/api/customers')) {
        apiRequest = request.url()
      }
    })

    await page.goto(`${FRONTEND_URL}/customers`)
    await page.waitForLoadState('networkidle')

    // Verify initial request has pagination params
    expect(apiRequest).toContain('page=1')
    expect(apiRequest).toContain('rows=10')
  })

  test('should send correct API parameters for sorting', async ({ page }) => {
    let lastApiRequest: string = ''

    // Capture API requests
    page.on('request', request => {
      if (request.url().includes('/api/customers')) {
        lastApiRequest = request.url()
      }
    })

    await page.goto(`${FRONTEND_URL}/customers`)
    await page.waitForLoadState('networkidle')

    // Click sort on ID column
    const idHeader = page.locator('th').filter({ hasText: 'รหัส' }).first()
    await idHeader.click()
    await page.waitForTimeout(700)

    // Verify request includes sort parameters
    expect(lastApiRequest).toContain('sidx=customer_id')
    expect(lastApiRequest).toMatch(/sord=(asc|desc)/)
  })

  test('should send correct API parameters for filtering', async ({ page }) => {
    let lastApiRequest: string = ''

    // Capture API requests
    page.on('request', request => {
      if (request.url().includes('/api/customers')) {
        lastApiRequest = request.url()
      }
    })

    await page.goto(`${FRONTEND_URL}/customers`)
    await page.waitForLoadState('networkidle')

    // Apply filter
    const firstnameFilter = page.locator('label:has-text("ชื่อ")').locator('..').locator('input')
    await firstnameFilter.fill('John')
    await page.waitForTimeout(700)

    // Verify request includes search parameters
    expect(lastApiRequest).toContain('_search=true')
    expect(lastApiRequest).toContain('firstname=John')
  })
})
