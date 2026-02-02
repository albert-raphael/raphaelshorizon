const puppeteer = require('puppeteer');

(async () => {
  const TARGET = process.env.TARGET_URL || 'https://raphaelshorizon.vercel.app';
  console.log('[e2e] Testing mobile hamburger menu against:', TARGET);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.goto(TARGET, { waitUntil: 'networkidle2', timeout: 120000 });

    // Wait for the toggle to appear
    await page.waitForSelector('.mobile-menu-toggle', { visible: true, timeout: 10000 });

    // Click the toggle
    await page.click('.mobile-menu-toggle');

    // Wait for menu active class
    await page.waitForSelector('.nav-menu.active', { visible: true, timeout: 5000 });

    // Verify ARIA state
    const ariaExpanded = await page.$eval('.mobile-menu-toggle', el => el.getAttribute('aria-expanded'));
    if (ariaExpanded !== 'true') {
      throw new Error(`Expected aria-expanded=true but found ${ariaExpanded}`);
    }

    // Verify at least one link is visible and clickable
    const firstLink = await page.$('.nav-menu .nav-link');
    if (!firstLink) throw new Error('No nav links found inside the mobile menu');

    // Click the first link and ensure menu closes (if it navigates, we tolerate navigation)
    await Promise.all([
      page.waitForTimeout(300),
      firstLink.click()
    ]);

    // After clicking a link, the menu should be closed (or we may navigate)
    const isActive = await page.$eval('.nav-menu', el => el.classList.contains('active'));
    if (isActive) {
      throw new Error('Nav menu remained open after clicking a link');
    }

    console.log('[e2e] Mobile hamburger menu test PASSED');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('[e2e] Mobile hamburger menu test FAILED:', err);
    await browser.close();
    process.exit(1);
  }
})();
