(async () => {
  try {
    const BACKEND = 'http://127.0.0.1:3000';
    console.log('Using backend:', BACKEND);

    function uniqueEmail() { return `tmp-${Date.now()}@example.com`; }
    const email = uniqueEmail();
    const password = 'Sm0keTest!';

    // Register
    let res = await fetch(BACKEND + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'TmpSmoke', email, password })
    });
    console.log('register status', res.status);
    const reg = await res.json();
    console.log('register:', reg);

    // Login
    res = await fetch(BACKEND + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    console.log('login status', res.status);
    const login = await res.json();
    console.log('login:', login);
    const token = login.token;

    // Create order
    res = await fetch(BACKEND + '/api/payments/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: 'monthly', amount: '9.99' })
    });
    console.log('create order status', res.status);
    const create = await res.json();
    console.log('create response:', create);
    const orderId = create.order && (create.order.id || create.orderID || create.orderId);

    // Capture
    res = await fetch(BACKEND + '/api/payments/capture', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ orderId })
    });
    console.log('capture status', res.status);
    const cap = await res.json();
    console.log('capture response', cap);

    // Status
    res = await fetch(BACKEND + '/api/subscriptions/status', {
      method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    });
    console.log('status', res.status);
    const status = await res.json();
    console.log('status response', status);

    process.exit(0);
  } catch (err) {
    console.error('Tmp smoke error', err);
    process.exit(2);
  }
})();