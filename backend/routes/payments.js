const express = require('express');
const router = express.Router();
const fetch = global.fetch || require('node-fetch');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// Return payment provider configuration (client-side)
router.get('/config', (req, res) => {
  const paypalClientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL_CLIENT_ID_PLACEHOLDER';
  const paypalEnabled = !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_SECRET;

  res.json({
    success: true,
    providers: {
      paypal: {
        enabled: paypalEnabled,
        clientId: paypalClientId,
        note: paypalEnabled ? 'Live PayPal configured' : 'Placeholder client ID in use; set PAYPAL_CLIENT_ID and PAYPAL_SECRET to enable live payments.'
      }
    }
  });
});

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const base = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const tokenRes = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error('Failed to get PayPal token: ' + body);
  }

  const data = await tokenRes.json();
  return data.access_token;
}

async function createPayPalOrder({ amount = '9.99', currency = 'USD', planId = 'default' } = {}) {
  const token = await getPayPalAccessToken();
  const base = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const res = await fetch(base + '/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount }, custom_id: planId }]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('PayPal order create failed: ' + body);
  }

  return await res.json();
}

async function capturePayPalOrder(orderId) {
  const token = await getPayPalAccessToken();
  const base = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const res = await fetch(base + `/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('PayPal capture failed: ' + body);
  }

  return await res.json();
}

// Create an order (server-side)
router.post('/create', async (req, res) => {
  const { planId, amount } = req.body || {};

  // Allow a test-mode simulated flow even if PayPal credentials are present.
  if (process.env.PAYPAL_TEST_MODE === 'simulate' || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    return res.json({
      success: true,
      placeholder: true,
      order: {
        id: 'SIMULATED_ORDER_' + Date.now(),
        planId: planId || 'disciple',
        amount: amount || '9.99',
        status: 'CREATED'
      }
    });
  }

  try {
    const order = await createPayPalOrder({ amount, planId });
    return res.json({ success: true, order });
  } catch (err) {
    console.error('PayPal create error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Capture an order and update user subscription
router.post('/capture', authenticate, async (req, res) => {
  const { orderId } = req.body || {};

  console.log('Capture called. auth header:', req.headers.authorization);
  console.log('req.user:', req.user && (req.user._id || req.user.id || req.user.email));

  if (!orderId) return res.status(400).json({ success: false, message: 'Missing orderId' });

  if (process.env.PAYPAL_TEST_MODE === 'simulate' || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    // Simulate a capture and activate user's subscription for 30 days
    try {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      // If req.user lacks helper method in embedded mode, attach subscription directly
      if (req.user && typeof req.user.activateSubscription !== 'function') {
        req.user.subscription = req.user.subscription || {};
        req.user.subscription.provider = 'simulated';
        req.user.subscription.subscriptionId = 'SIM-' + Date.now();
        req.user.subscription.planId = 'monthly';
        req.user.subscription.status = 'active';
        req.user.subscription.currentPeriodEnd = expires;

        // Persist back to embedded store if applicable
        if (!process.env.MONGO_URI) {
          const path = require('path').resolve(__dirname, '..', '..', 'embedded-data', 'users.json');
          const fs = require('fs');
          let users = [];
          try { users = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : []; } catch (e) { users = []; }
          const u = users.find(x => x._id === (req.user._id || req.user.id));
          if (u) {
            u.subscription = req.user.subscription;
            fs.writeFileSync(path, JSON.stringify(users, null, 2));
          }
        }

        return res.json({ success: true, simulated: true, subscription: req.user.subscription });
      }

      await req.user.activateSubscription({ provider: 'simulated', planId: 'monthly', subscriptionId: 'SIM-' + Date.now(), currentPeriodEnd: expires });
      return res.json({ success: true, simulated: true, subscription: req.user.subscription });
    } catch (e) {
      console.error('Simulated capture error', e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  try {
    const capture = await capturePayPalOrder(orderId);
    // Determine plan and capture id
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || (capture.id || null);
    const planId = capture.purchase_units?.[0]?.custom_id || 'paypal-subscription';

    // Activate subscription for 30 days by default (this could be replaced with real subscription info)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await req.user.activateSubscription({ provider: 'paypal', planId, subscriptionId: captureId, currentPeriodEnd: expires, metadata: { capture } });

    return res.json({ success: true, capture, subscription: req.user.subscription });
  } catch (err) {
    console.error('PayPal capture error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Helpers for products/plans/subscriptions
async function createPayPalProduct() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const base = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  const token = await getPayPalAccessToken();

  // If a product id is supplied in env, reuse it
  if (process.env.PAYPAL_PRODUCT_ID) return process.env.PAYPAL_PRODUCT_ID;

  const res = await fetch(base + '/v1/catalogs/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ name: "Raphael's Horizon", description: 'Subscription product for Raphael\'s Horizon', type: 'SERVICE', category: 'SOFTWARE' })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Failed to create PayPal product: ' + body);
  }

  const data = await res.json();
  return data.id;
}

async function createPayPalPlan(productId, { price = '9.99', currency = 'USD', interval = { unit: 'MONTH', count: 1 } } = {}) {
  // If an existing plan id is provided via env, return it
  if (process.env.PAYPAL_PLAN_ID) return process.env.PAYPAL_PLAN_ID;

  const token = await getPayPalAccessToken();
  const base = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const planPayload = {
    product_id: productId,
    name: `Monthly ${price} ${currency}`,
    billing_cycles: [
      {
        frequency: { interval_unit: interval.unit, interval_count: interval.count },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: price, currency_code: currency } }
      }
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: '0', currency_code: currency },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3
    }
  };

  const res = await fetch(base + '/v1/billing/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(planPayload)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Failed to create PayPal plan: ' + body);
  }

  const data = await res.json();
  // Best-effort: try to activate if status is CREATED
  if (data.id && data.status === 'CREATED') {
    try {
      await fetch(base + `/v1/billing/plans/${data.id}/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } });
    } catch (e) {
      // Non-fatal
    }
  }

  return data.id;
}

async function createPayPalSubscription({ planId, application_context = {} } = {}) {
  const token = await getPayPalAccessToken();
  const base = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const res = await fetch(base + '/v1/billing/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ plan_id: planId, application_context })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Failed to create subscription: ' + body);
  }

  return await res.json();
}

// Create subscription (returns subscription object and approve link)
router.post('/create-subscription', authenticate, async (req, res) => {
  const { planPrice = '9.99', currency = 'USD' } = req.body || {};

  // Simulate for test-mode
  if (process.env.PAYPAL_TEST_MODE === 'simulate' || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    try {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const subId = 'SIM_SUB_' + Date.now();
      await req.user.activateSubscription({ provider: 'simulated', planId: 'monthly', subscriptionId: subId, currentPeriodEnd: expires });
      return res.json({ success: true, simulated: true, subscription: req.user.subscription });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  try {
    // Ensure a product and plan exist
    const productId = await createPayPalProduct();
    const planId = await createPayPalPlan(productId, { price: planPrice, currency });

    const application_context = {
      brand_name: "Raphael's Horizon",
      locale: 'en-US',
      return_url: process.env.PAYPAL_RETURN_URL || 'https://raphaelshorizon.vercel.app/pages/profile/subscription.html',
      cancel_url: process.env.PAYPAL_CANCEL_URL || 'https://raphaelshorizon.vercel.app/pages/profile/subscription.html'
    };

    const subscription = await createPayPalSubscription({ planId, application_context });

    // Find approval link
    const approveLink = (subscription.links || []).find(l => l.rel === 'approve');

    return res.json({ success: true, subscription, approveLink: approveLink ? approveLink.href : null });
  } catch (err) {
    console.error('create-subscription error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Confirm subscription (after user approves) - fetch subscription details and attach to user if active
router.post('/subscriptions/confirm', authenticate, async (req, res) => {
  const { subscriptionId } = req.body || {};
  if (!subscriptionId) return res.status(400).json({ success: false, message: 'Missing subscriptionId' });

  // Simulate path
  if (process.env.PAYPAL_TEST_MODE === 'simulate' || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    try {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      // Fallback if helper missing (embedded mode)
      if (!req.user || typeof req.user.activateSubscription !== 'function') {
        req.user.subscription = req.user.subscription || {};
        req.user.subscription.provider = 'simulated';
        req.user.subscription.planId = 'monthly';
        req.user.subscription.subscriptionId = subscriptionId;
        req.user.subscription.status = 'active';
        req.user.subscription.currentPeriodEnd = expires;

        if (!process.env.MONGO_URI) {
          const path = require('path').resolve(__dirname, '..', '..', 'embedded-data', 'users.json');
          const fs = require('fs');
          let users = [];
          try { users = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : []; } catch (err) { users = []; }
          const u = users.find(x => x._id === (req.user && (req.user._id || req.user.id)));
          if (u) {
            u.subscription = req.user.subscription;
            fs.writeFileSync(path, JSON.stringify(users, null, 2));
          }
        }

        return res.json({ success: true, simulated: true, subscription: req.user.subscription });
      }

      await req.user.activateSubscription({ provider: 'simulated', planId: 'monthly', subscriptionId, currentPeriodEnd: expires });
      return res.json({ success: true, simulated: true, subscription: req.user.subscription });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  try {
    const token = await getPayPalAccessToken();
    const base = process.env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const r = await fetch(base + `/v1/billing/subscriptions/${subscriptionId}`, { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) {
      const body = await r.text();
      throw new Error('Failed to fetch subscription: ' + body);
    }

    const data = await r.json();
    // Attach to user if active
    const status = data.status;
    const nextBilling = data.billing_info && data.billing_info.next_billing_time ? new Date(data.billing_info.next_billing_time) : null;

    if (status === 'ACTIVE' || status === 'APPROVAL_PENDING' || status === 'APPROVED') {
      await req.user.activateSubscription({ provider: 'paypal', planId: data.plan_id, subscriptionId: data.id, currentPeriodEnd: nextBilling, metadata: { paypal: data } });
      return res.json({ success: true, subscription: req.user.subscription });
    }

    return res.status(400).json({ success: false, message: 'Subscription not active', data });
  } catch (err) {
    console.error('subscriptions/confirm error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Webhook endpoint - verify signature when possible
router.post('/webhook', express.json(), async (req, res) => {
  console.log('PAYPAL WEBHOOK RECEIVED', req.headers['paypal-transmission-id'] || '', req.body.event_type);

  const verification = await verifyPayPalWebhook(req);
  if (verification && verification.verified) {
    console.log('PayPal webhook verified:', verification.raw);
  } else {
    console.warn('PayPal webhook NOT verified or verification skipped:', verification && (verification.reason || verification.error || verification.raw));
  }

  // Process webhook events: update user's subscription based on subscription events
  try {
    const eventType = req.body.event_type;
    const resource = req.body.resource || {};

    if (eventType && eventType.startsWith('BILLING.SUBSCRIPTION')) {
      const subId = resource.id;
      const status = resource.status;
      const nextBilling = resource.billing_info && resource.billing_info.next_billing_time ? new Date(resource.billing_info.next_billing_time) : null;

      // Try to find user by subscriptionId or subscriber email
      let user = null;
      if (subId) user = await User.findOne({ 'subscription.subscriptionId': subId });
      if (!user && resource.subscriber && resource.subscriber.email_address) {
        user = await User.findOne({ email: resource.subscriber.email_address });
      }

      if (user) {
        user.subscription = user.subscription || {};
        user.subscription.provider = 'paypal';
        user.subscription.subscriptionId = subId || user.subscription.subscriptionId;
        user.subscription.planId = resource.plan_id || user.subscription.planId;
        user.subscription.status = status || user.subscription.status;
        user.subscription.currentPeriodEnd = nextBilling || user.subscription.currentPeriodEnd;
        user.subscription.metadata = user.subscription.metadata || {};
        user.subscription.metadata.lastWebhook = req.body;
        await user.save();
        console.log('Updated subscription for user:', user.email, 'status:', user.subscription.status);
      } else {
        console.log('No user found for subscription webhook:', subId, resource.subscriber && resource.subscriber.email_address);
      }
    }

    // Additional events like PAYMENT.CAPTURE.COMPLETED could be handled here
  } catch (err) {
    console.error('Error processing webhook event', err);
  }

  res.json({ success: true, verified: !!verification.verified });
});

module.exports = router;
