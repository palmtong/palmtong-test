import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Playwright configuration for Palmtong E2E tests
 * Tests run against deployed Cloudflare Workers (backend) and Pages (frontend)
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration
  // IMPORTANT: HTML report set to 'open: never' - Claude Code cannot access browser-based reports
  // Always use JSON output (test-results/results.json) for automated analysis
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }], // For manual debugging only
    ['json', { outputFile: 'test-results/results.json' }],           // Primary output for Claude Code
    ['junit', { outputFile: 'test-results/junit.xml' }],             // For CI/CD integration
    ['list']                                                          // Console output during test runs
  ],

  // Shared settings for all tests
  use: {
    // Base URL for API tests (backend)
    baseURL: process.env.BACKEND_URL || 'http://localhost:8787',

    // Browser options
    headless: true,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,

    // Artifacts
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // API testing options
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/',
});
