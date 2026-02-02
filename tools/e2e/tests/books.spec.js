const { test, expect } = require('@playwright/test');

const BASE = 'http://127.0.0.1:5500';
const PAGE = '/pages/books/books-reader/books-online.html';

test.describe('Books reader smoke tests', () => {
  test('unauthenticated users are redirected to login when clicking Read Online', async ({ page }) => {
    await page.goto(BASE + PAGE);
    await page.waitForSelector('.library-book-card', { timeout: 5000 });

    // Click first read button
    const firstBtn = await page.$('.read-online-btn');
    await firstBtn.click();

    // Expect redirect to login
    await page.waitForURL('**/pages/admin/login.html**', { timeout: 5000 });
    expect(page.url()).toContain('/pages/admin/login.html');
  });

  test('authenticated users can open reader', async ({ page }) => {
    // Inject auth before navigation
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'test-token');
      localStorage.setItem('user', JSON.stringify({ name: 'Playwright Test' }));
    });

    await page.goto(BASE + PAGE);
    await page.waitForSelector('.library-book-card', { timeout: 5000 });

    const firstBtn = await page.$('.read-online-btn');
    await firstBtn.click();

    // Wait for reader to show
    await page.waitForSelector('#reader-book-title', { timeout: 10000 });
    const title = await page.textContent('#reader-book-title');
    expect(title).toBeTruthy();

    // Check page count element exists
    await page.waitForSelector('#total-pages', { timeout: 10000 });
    const tp = await page.textContent('#total-pages');
    expect(tp).toBeTruthy();
  });
});
