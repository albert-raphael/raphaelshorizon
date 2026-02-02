const { test, expect } = require('@playwright/test');

const BACKEND = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:5002';

function uniqueEmail() {
  return `e2e+${Date.now()}@example.com`;
}

test.describe('Payments API smoke tests', () => {
  test('create and capture (simulated) activates subscription', async ({ request }) => {
    // Register user
    const email = uniqueEmail();
    const password = 'Passw0rd!';

    const reg = await request.post(`${BACKEND}/api/auth/register`, {
      data: { name: 'E2E User', email, password }
    });
    expect(reg.ok()).toBeTruthy();
    const regJson = await reg.json();
    expect(regJson.success).toBeTruthy();

    // Login
    const login = await request.post(`${BACKEND}/api/auth/login`, {
      data: { email, password }
    });
    expect(login.ok()).toBeTruthy();
    const loginJson = await login.json();
    expect(loginJson.token).toBeTruthy();
    const token = loginJson.token;

    // Create order
    const create = await request.post(`${BACKEND}/api/payments/create`, {
      data: { planId: 'monthly', amount: '9.99' }
    });

    expect(create.ok()).toBeTruthy();
    const createJson = await create.json();
    expect(createJson.success).toBeTruthy();
    expect(createJson.order).toBeTruthy();

    const orderId = createJson.order.id;
    expect(orderId).toBeTruthy();

    // Capture (authenticated)
    const cap = await request.post(`${BACKEND}/api/payments/capture`, {
      data: { orderId },
      headers: { Authorization: 'Bearer ' + token }
    });

    expect(cap.ok()).toBeTruthy();
    const capJson = await cap.json();
    expect(capJson.success).toBeTruthy();

    // Check subscription status
    const status = await request.get(`${BACKEND}/api/subscriptions/status`, { headers: { Authorization: 'Bearer ' + token } });
    expect(status.ok()).toBeTruthy();
    const statusJson = await status.json();
    expect(statusJson.success).toBeTruthy();
    expect(statusJson.isActive).toBeTruthy();
  });

  test('create-subscription (simulated) activates subscription', async ({ request }) => {
    const email = uniqueEmail();
    const password = 'Passw0rd!';

    // Register and login
    await request.post(`${BACKEND}/api/auth/register`, { data: { name: 'E2E User', email, password } });
    const login = await request.post(`${BACKEND}/api/auth/login`, { data: { email, password } });
    const loginJson = await login.json();
    const token = loginJson.token;

    // Create subscription (simulate via CI env)
    const createSub = await request.post(`${BACKEND}/api/payments/create-subscription`, { data: { planPrice: '9.99' }, headers: { Authorization: 'Bearer ' + token } });
    expect(createSub.ok()).toBeTruthy();
    const createSubJson = await createSub.json();
    expect(createSubJson.success).toBeTruthy();

    // Check subscription status
    const status = await request.get(`${BACKEND}/api/subscriptions/status`, { headers: { Authorization: 'Bearer ' + token } });
    const statusJson = await status.json();
    expect(statusJson.success).toBeTruthy();
    expect(statusJson.isActive).toBeTruthy();
  });
});