(async () => {
  try {
    const BACKEND = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:5002';
    console.log('Using backend:', BACKEND);

    function uniqueEmail() { return `smoke+${Date.now()}@example.com`; }
    const email = uniqueEmail();
    const password = 'Sm0keTest!';

    // Register
    let res = await fetch(BACKEND + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Smoke', email, password })
    });
    console.log('register status', res.status);
    const reg = await res.json();
    console.log('register:', reg.success);

    // Login
    res = await fetch(BACKEND + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    console.log('login status', res.status);
    const login = await res.json();
    console.log('login token?', !!login.token);
    const token = login.token;

    // Create order
    res = await fetch(BACKEND + '/api/payments/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: 'monthly', amount: '9.99' })
    });
    console.log('create order status', res.status);
    const create = await res.json();
    console.log('order:', create.order && (create.order.id || create.orderID));
    const orderId = create.order && (create.order.id || create.orderID || create.orderId);

    // Capture
    res = await fetch(BACKEND + '/api/payments/capture', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ orderId })
    });
    console.log('capture status', res.status);
    const cap = await res.json();
    console.log('capture success', cap.success);

    // Status
    res = await fetch(BACKEND + '/api/subscriptions/status', {
      method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    });
    console.log('status', res.status);
    const status = await res.json();
    console.log('isActive', status.isActive, 'subscription:', status.subscription && status.subscription.status);

    process.exit(0);
  } catch (err) {
    console.error('Smoke error', err);
    process.exit(2);
  }
})();