const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// Get subscription status for current user
router.get('/status', authenticate, async (req, res) => {
  try {
    console.log('Subscriptions.status called. req.user summary:', {
      id: req.user && (req.user._id || req.user.id),
      hasActivate: !!(req.user && req.user.activateSubscription),
      subscription: req.user && req.user.subscription
    });
    // Embedded mode: req.user is a plain object read from JSON store
    if (!process.env.MONGO_URI) {
      const u = req.user || {};
      const subscription = u.subscription || {};
      let isActive = false;
      if (subscription.status === 'active') {
        if (subscription.currentPeriodEnd) {
          isActive = new Date(subscription.currentPeriodEnd) > new Date();
        } else {
          isActive = true;
        }
      }
      // Sanitize subscription for JSON response to avoid circular refs or complex objects
      const safeSub = {
        provider: subscription.provider || null,
        planId: subscription.planId || subscription.plan || null,
        subscriptionId: subscription.subscriptionId || subscription.subId || null,
        status: subscription.status || null,
        currentPeriodEnd: subscription.currentPeriodEnd ? (new Date(subscription.currentPeriodEnd)).toISOString() : null
      };
      return res.json({ success: true, subscription: safeSub, isActive });
    }

    const user = await User.findById(req.user.id).select('subscription');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isActive = user.isActiveSubscriber ? user.isActiveSubscriber() : false;
    const subscription = user.subscription || {};
    const safeSub = {
      provider: subscription.provider || null,
      planId: subscription.planId || subscription.plan || null,
      subscriptionId: subscription.subscriptionId || subscription.subId || null,
      status: subscription.status || null,
      currentPeriodEnd: subscription.currentPeriodEnd ? (new Date(subscription.currentPeriodEnd)).toISOString() : null
    };
    res.json({ success: true, subscription: safeSub, isActive });
  } catch (error) {
    console.error('Subscriptions status error:', error && (error.stack || error));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create subscription (simulated when PayPal not configured)
router.post('/create', authenticate, async (req, res) => {
  try {
    const { plan } = req.body || {};

    if (!process.env.PAYPAL_CLIENT_ID) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const subId = 'SIM-' + Date.now();
      if (!req.user || typeof req.user.activateSubscription !== 'function') {
        req.user.subscription = req.user.subscription || {};
        req.user.subscription.provider = 'simulated';
        req.user.subscription.planId = plan || 'monthly';
        req.user.subscription.subscriptionId = subId;
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

      await req.user.activateSubscription({ provider: 'simulated', planId: plan || 'monthly', subscriptionId: subId, currentPeriodEnd: expires });
      return res.json({ success: true, simulated: true, subscription: req.user.subscription });
    }

    // For real PayPal flows, the frontend should call /api/payments/create and then /api/payments/capture
    res.json({ success: true, message: 'Use /api/payments/create and /api/payments/capture to complete subscription purchase' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cancel subscription
router.post('/cancel', authenticate, async (req, res) => {
  try {
    await req.user.cancelSubscription();
    res.json({ success: true, subscription: req.user.subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Legacy check-access kept for compatibility
router.post('/check-access', authenticate, async (req, res) => {
  try {
    const { contentType } = req.body;
    const user = await User.findById(req.user.id);

    let hasAccess = false;
    let message = 'Access denied';

    if (contentType === 'basic') {
      hasAccess = true;
    } else if (['online-books', 'audio-books', 'online-reading'].includes(contentType)) {
      hasAccess = user.isActiveSubscriber ? user.isActiveSubscriber() : false;
      if (!hasAccess) message = 'Upgrade to a subscription to access this content';
    }

    res.json({ success: true, data: { hasAccess, message: hasAccess ? 'Access granted' : message } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;