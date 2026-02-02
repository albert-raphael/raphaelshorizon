// payments.js - frontend payment helper (placeholder)

async function loadPaymentConfig() {
  try {
    const res = await fetch('/api/payments/config');
    if (!res.ok) throw new Error('Failed to fetch payment config');
    return await res.json();
  } catch (e) {
    console.warn('Payment config fetch failed:', e);
    return { success: false };
  }
}

async function initSubscriptionButtons() {
  const [config, statusResp] = await Promise.all([loadPaymentConfig(), fetch('/api/subscriptions/status').then(r => r.ok ? r.json().catch(() => null) : null).catch(() => null)]);
  const container = document.getElementById('payment-widget');
  if (!container) return;

  const isSubscribed = statusResp && statusResp.isActive;
  if (isSubscribed) {
    const expires = statusResp.subscription && statusResp.subscription.currentPeriodEnd ? new Date(statusResp.subscription.currentPeriodEnd).toLocaleString() : '—';
    container.innerHTML = `<div class="subscription-status"><p class="text-success">You are subscribed. Expires: ${expires}</p></div>`;
    return;
  }

  if (config && config.providers && config.providers.paypal && config.providers.paypal.enabled) {
    const clientId = config.providers.paypal.clientId;
    // Load PayPal SDK
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    s.async = true;
    s.onload = () => {
      // eslint-disable-next-line no-undef
      paypal.Buttons({
        style: { layout: 'vertical' },
        createOrder: function(data, actions) {
          // Call server to create order
          return fetch('/api/payments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId: 'monthly', amount: '9.99' })
          }).then(res => res.json()).then(json => {
            if (json && json.order) return json.order.id || json.orderID || json.orderId;
            // fallback to client-side create
            return actions.order.create({ purchase_units: [{ amount: { value: '9.99' } }] });
          });
        },
        onApprove: function(data, actions) {
          const orderId = data.orderID || data.orderId || data.id;
          // Ask server to capture and attach subscription
          return fetch('/api/payments/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('authToken') ? ('Bearer ' + localStorage.getItem('authToken')) : undefined
            },
            body: JSON.stringify({ orderId })
          }).then(res => res.json()).then(json => {
            if (json && json.success) {
              container.innerHTML = '<p class="text-success">Payment successful — subscription active.</p>';
              return;
            }
            throw new Error((json && json.message) || 'Capture failed');
          });
        }
      }).render('#payment-widget');
    };
    s.onerror = () => {
      container.innerHTML = '<p class="text-danger">Failed to load PayPal. Please configure PAYPAL_CLIENT_ID.</p>';
    };
    document.head.appendChild(s);
  } else {
    // Show placeholder with instructions and fallback button to simulate purchase
    container.innerHTML = `
      <div class="payment-placeholder">
        <p><strong>PayPal integration not configured.</strong></p>
        <p>Set <code>PAYPAL_CLIENT_ID</code> in your server environment or Vercel secrets to enable live payments.</p>
        <button class="btn btn-primary" id="simulate-pay-btn"><i class="fab fa-paypal"></i> Simulate purchase</button>
      </div>
    `;

    const btn = document.getElementById('simulate-pay-btn');
    if (btn) btn.addEventListener('click', async () => {
      // If not logged in, redirect to login
      if (!localStorage.getItem('authToken')) {
        sessionStorage.setItem('returnTo', window.location.pathname);
        window.location.href = (window.location.pathname.startsWith('/frontend') ? '/frontend/pages/admin/login.html' : '/pages/admin/login.html');
        return;
      }

      const res = await fetch('/api/subscriptions/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('authToken') } });
      const json = await res.json();
      if (json && json.success) {
        container.innerHTML = '<p class="text-success">Subscription activated (simulated)</p>';
      } else {
        container.innerHTML = '<p class="text-danger">Failed to activate subscription</p>';
      }
    });
  }
}

function openPaymentPlaceholder() {
  alert('This is a placeholder payment flow. Replace with live PayPal credentials and server implementation.');
}

// Initialize on pages with subscription widget
document.addEventListener('DOMContentLoaded', () => {
  initSubscriptionButtons();
});
