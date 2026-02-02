const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:5500/frontend'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ],
  outputDir: 'test-results'
});
