const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const base = 'http://127.0.0.1:5500/frontend';
  const pageUrl = base + '/pages/books/books-reader/books-online.html';

  console.log('Navigating to', pageUrl);
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  await page.goto(pageUrl, { timeout: 10000 });

  // Dump HTML for debugging
  const body = await page.content();
  const fs = require('fs');
  fs.writeFileSync('./debug-books-online.html', body);
  console.log('Wrote debug HTML to tools/e2e/debug-books-online.html');

  // Check that library renders
  const bookCard = await page.$('.library-book-card');
  if (!bookCard) {
    console.error('❌ No book cards found');
    await browser.close();
    process.exit(2);
  }
  console.log('✅ Library book cards found');

  // Sanity check: ensure openBookReader is the page function we expect
  const fn = await page.evaluate(() => openBookReader && openBookReader.toString());
  console.log('openBookReader():', (fn || '').substring(0, 200));

  // Click read online as unauthenticated - should redirect to login
  await page.click('.read-online-btn');
  // Some environments abort the navigation; verify returnTo was set instead
  await page.waitForTimeout(500);
  const returnTo = await page.evaluate(() => sessionStorage.getItem('returnTo'));
  if (returnTo) {
    console.log('✅ Unauthenticated click set returnTo:', returnTo);
  } else {
    try {
      await page.waitForURL('**/pages/admin/login.html**', { timeout: 3000 });
      console.log('✅ Unauthenticated click redirected to login');
    } catch (e) {
      console.error('❌ Unauthenticated click did not redirect to login or set returnTo. Current URL:', page.url());
      await browser.close();
      process.exit(3);
    }
  }

  // Now simulate auth and open reader
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Smoke Test' }));
  });
  await page.goto(pageUrl);
  await page.waitForSelector('.library-book-card');
  await page.click('.read-online-btn');

  // Wait for reader title
  try {
    await page.waitForSelector('#reader-book-title', { timeout: 15000 });
    const title = await page.textContent('#reader-book-title');
    console.log('✅ Reader opened, title:', title.trim());
  } catch (e) {
    console.error('❌ Reader did not open for authenticated user');
    await browser.close();
    process.exit(4);
  }

  await browser.close();
  console.log('All smoke tests passed ✅');
  process.exit(0);
})();
