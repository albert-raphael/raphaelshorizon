const { test, expect } = require('@playwright/test');

const FRONTEND = process.env.TEST_BASE_URL || 'http://127.0.0.1:5500/frontend';
const BACKEND = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:5002';

const BUYER_EMAIL = process.env.PAYPAL_TEST_BUYER_EMAIL;
const BUYER_PASS = process.env.PAYPAL_TEST_BUYER_PASS;

if (!process.env.PAYPAL_TEST_BUYER_EMAIL || !process.env.PAYPAL_TEST_BUYER_PASS) {
  test.skip(true, 'PayPal sandbox buyer credentials not provided');
}

function uniqueEmail() {
  return `ui-e2e+${Date.now()}@example.com`;
}

test.describe('PayPal UI integration (sandbox)', () => {
  test('checkout and approve subscription as buyer then confirm subscription attached', async ({ page, request }) => {
    // Create a user via API and login to get token
    const email = uniqueEmail();
    const password = 'Playwright1!';

    const reg = await request.post(`${BACKEND}/api/auth/register`, { data: { name: 'UI E2E', email, password } });
    expect(reg.ok()).toBeTruthy();

    const login = await request.post(`${BACKEND}/api/auth/login`, { data: { email, password } });
    expect(login.ok()).toBeTruthy();
    const loginJson = await login.json();
    const token = loginJson.token;
    expect(token).toBeTruthy();

    // Set auth token in localStorage before visiting page
    await page.addInitScript(token => {
      window.localStorage.setItem('authToken', token);
    }, token);

    // Visit subscription page
    await page.goto(FRONTEND + '/pages/profile/subscription.html');
    await page.waitForSelector('#payment-widget', { timeout: 10000 });

    // Wait for PayPal button to be rendered
    // Buttons are in an iframe - look for iframe with title containing "PayPal"
    const ppFrame = await page.frameLocator('iframe[title*="PayPal"]');
    // If the PayPal SDK is used, the main button container may be a button element
    // Click the PayPal button (use a generic selector)
    // Fallback: click a visible button inside #payment-widget
    try {
      await page.click('#payment-widget button');
    } catch (err) {
      // try clicking any paypal-like button
      const btn = await page.$('#payment-widget iframe');
      if (btn) {
        // click middle of widget if possible
        await page.click('#payment-widget');
      } else {
        throw err;
      }
    }

    // Wait for popup (PayPal window)
    const popup = await page.waitForEvent('popup', { timeout: 20000 });
    await popup.waitForLoadState('networkidle');

    // PayPal login flow (sandbox) - try common selectors
    try {
      await popup.waitForSelector('input[type=email], input#email, input[name=email]', { timeout: 10000 });
      // fill email
      await popup.fill('input[type=email], input#email, input[name=email]', BUYER_EMAIL);
      await popup.click('button[type=submit], button#btnNext, button#login');
    } catch (e) {
      console.warn('Email input not found, trying alternative selectors');
    }

    try {
      await popup.waitForSelector('input[type=password], input#password, input[name=password]', { timeout: 10000 });
      await popup.fill('input[type=password], input#password, input[name=password]', BUYER_PASS);
      await popup.click('button[type=submit], button#btnLogin, button#login');
    } catch (e) {
      console.warn('Password input not found or auto-logged-in', e.message);
    }

    // Approve/Pay button
    try {
      await popup.waitForSelector('button[name=approve], button#approveBtn, button[role=button]:text("Approve"), text=Approve', { timeout: 15000 });
      // click the approve-like button
      await popup.click('button[name=approve], button#approveBtn, button[role=button]:text("Approve"), text=Approve');
    } catch (e) {
      console.warn('Approve button not found, trying alternative text');
      // try clicking generic continue button
      try {
        await popup.click('button[type=submit]');
      } catch (err) {
        console.warn('Could not click any approve button', err.message);
      }
    }

    // Wait for popup to close or return to main page
    try {
      await popup.waitForEvent('close', { timeout: 20000 });
    } catch (e) {
      // If it didn't close, try to close it ourselves
      try { await popup.close(); } catch (_) {}
    }

    // Wait for subscription confirmation to be visible on page
    await page.waitForTimeout(2000);

    // Poll backend subscription status
    const statusResp = await request.get(`${BACKEND}/api/subscriptions/status`, { headers: { Authorization: 'Bearer ' + token } });
    expect(statusResp.ok()).toBeTruthy();
    const statusJson = await statusResp.json();
    expect(statusJson.success).toBeTruthy();
    expect(statusJson.isActive).toBeTruthy();
  }, 120000);
});