# Palmtong Integration Tests

Playwright-based integration tests for the Palmtong dealership management system.

## For Claude Code (Automated Testing)

**CRITICAL: Claude Code cannot access browser-based reports or HTTP servers**

### ✅ Correct Usage

```bash
# Run tests
npm test

# Analyze results (JSON output)
npm run test:json        # Quick statistics
npm run test:failures    # List failing tests

# Or use jq directly
cat test-results/results.json | jq '.stats'
```

### ❌ NEVER Use These Commands

These commands open browsers or HTTP servers that Claude Code cannot access:

```bash
# ❌ BLOCKED - Opens browser
npm run test:report
npx playwright show-report

# ❌ BLOCKED - Opens UI/debugger
npm run MANUAL:test:ui
npm run MANUAL:test:debug
npm run MANUAL:test:headed
```

## Configuration

- **Test Output**: `test-results/results.json` (primary)
- **HTML Report**: `playwright-report/` (manual debugging only, never auto-opens)
- **Playwright Config**: `playwright.config.ts` (set `open: 'never'` for HTML reports)

## Test Structure

```
tests/
├── api/
│   └── backend.spec.ts       # Backend API integration tests
├── e2e/
│   └── frontend.spec.ts      # Frontend E2E tests
└── flows/
    └── user-flows.spec.ts    # Complete user workflow tests
```

## Environment Variables

Create `.env` file with:

```env
BACKEND_URL=https://palmtong-cf.anu-9da.workers.dev
FRONTEND_URL=https://a1c71a40.palmtong-frontend.pages.dev
```

## Available Scripts

### Automated (Claude Code Compatible)
- `npm test` - Run all tests, output to JSON
- `npm run test:json` - Show test statistics
- `npm run test:failures` - List failing test names
- `npm run test:backend` - Run only backend API tests
- `npm run test:e2e` - Run only E2E tests

### Manual (Human Use Only)
- `npm run MANUAL:test:report` - Open HTML report in browser
- `npm run MANUAL:test:ui` - Open interactive test UI
- `npm run MANUAL:test:debug` - Run tests in debug mode
- `npm run MANUAL:test:headed` - Run tests with visible browser

## Analyzing Test Results

### Quick Stats
```bash
npm run test:json
```

Output:
```json
{
  "expected": 73,
  "unexpected": 187,
  "skipped": 0
}
```

### List Failures
```bash
npm run test:failures
```

### Custom Analysis
```bash
# Get specific test details
cat test-results/results.json | jq '.suites[0].suites[0].specs[0]'

# Find tests by name
cat test-results/results.json | jq '.suites[].suites[].specs[] | select(.title | contains("bike")) | .title'

# Get error messages
cat test-results/results.json | jq '.suites[].suites[].specs[] | select(.ok == false) | {title: .title, error: .tests[0].results[0].error.message}'
```

## CI/CD Integration

Tests are designed to run against deployed Cloudflare environments:
- Backend: Cloudflare Workers
- Frontend: Cloudflare Pages
- Database: D1 (SQLite)

**Test execution flow:**
1. Deploy backend → `npx wrangler deploy`
2. Deploy frontend → `npx wrangler pages deploy dist`
3. Update `.env` with deployment URLs
4. Run tests → `npm test`
5. Analyze JSON → `npm run test:json`

## Browser Compatibility

Tests run across multiple browsers and viewports:
- Desktop: Chromium, Firefox, WebKit
- Mobile: Chrome (Pixel 5), Safari (iPhone 13)

For Claude Code analysis, focus on Chromium results first.

## Debugging Failed Tests

**For Claude Code:**
1. Run `npm run test:failures` to see which tests failed
2. Read JSON output for error details
3. Check specific test with jq
4. Fix code based on error messages
5. Redeploy and retest

**For Manual Debugging:**
1. Run `npm run MANUAL:test:ui` to open interactive mode
2. Or run specific test: `npx playwright test tests/api/backend.spec.ts --debug`
3. Use trace files in `test-results/` for detailed inspection

## Key Principles

1. **JSON First**: Always analyze JSON output, never rely on browser reports
2. **Deployed Tests**: Tests run against actual Cloudflare deployments, not localhost
3. **No Manual Steps**: All testing should be automatable via scripts
4. **Clear Errors**: Test failures should provide actionable error messages
5. **Fast Feedback**: Use `test:json` for quick pass/fail stats before deep analysis
