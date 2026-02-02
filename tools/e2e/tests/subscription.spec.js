const { test, expect } = require('@playwright/test');

const BASE = 'http://127.0.0.1:5500/frontend';
const SUB_PAGE = '/pages/profile/subscription.html';

test.describe('Subscription smoke tests', () => {
  test('unauthenticated users clicking simulate purchase are redirected to login', async ({ page }) => {
    await page.goto(BASE + SUB_PAGE);
    await page.waitForSelector('#payment-widget', { timeout: 5000 });

    const simulateBtn = await page.$('#simulate-pay-btn');
    expect(simulateBtn).toBeTruthy();

    await simulateBtn.click();

    const returnTo = await page.evaluate(() => sessionStorage.getItem('returnTo'));
    expect(returnTo).toBeTruthy();
  });
});
