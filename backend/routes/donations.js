const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Initialize Stripe lazily (after .env is loaded)
let stripe = null;
function getStripe() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || secretKey === 'sk_live_xxxxxx') {
      console.warn('Stripe secret key not configured. Stripe payments will be disabled.');
      return null;
    }
    stripe = require('stripe')(secretKey);
  }
  return stripe;
}

// Donations storage file path
const DONATIONS_FILE = path.join(__dirname, '..', 'embedded-data', 'donations.json');

// Helper to read donations
function getDonations() {
  try {
    if (fs.existsSync(DONATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(DONATIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading donations file:', e);
  }
  return [];
}

// Helper to save donations
function saveDonation(donation) {
  try {
    const donations = getDonations();
    donations.push({
      ...donation,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(DONATIONS_FILE, JSON.stringify(donations, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving donation:', e);
    return false;
  }
}

// ==========================================
// STRIPE DONATION ENDPOINTS
// ==========================================

// Create a Stripe Payment Intent for donations
router.post('/stripe/create-intent', async (req, res) => {
  try {
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { amount, currency = 'usd', description } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ 
        error: 'Invalid amount. Minimum donation is $1.' 
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description: description || "Raphael's Horizon Donation",
      metadata: {
        type: 'donation',
        source: 'website'
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe create intent error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create payment intent' 
    });
  }
});

// Confirm Stripe payment and record donation
router.post('/stripe', async (req, res) => {
  try {
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { paymentMethodId, amount, currency = 'usd', description } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    if (!amount || amount < 100) { // Amount in cents
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create and confirm the payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amount, // Already in cents from frontend
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      description: description || "Raphael's Horizon Donation",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        type: 'donation',
        source: 'website'
      }
    });

    // Check if additional authentication is required
    if (paymentIntent.status === 'requires_action' || 
        paymentIntent.status === 'requires_source_action') {
      return res.json({
        requires_action: true,
        client_secret: paymentIntent.client_secret
      });
    }

    // Payment succeeded
    if (paymentIntent.status === 'succeeded') {
      // Record the donation
      saveDonation({
        provider: 'stripe',
        paymentId: paymentIntent.id,
        amount: amount / 100, // Convert back to dollars
        currency: currency.toUpperCase(),
        status: 'completed'
      });

      return res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount
        }
      });
    }

    // Unexpected status
    return res.status(400).json({
      error: `Payment failed with status: ${paymentIntent.status}`
    });

  } catch (error) {
    console.error('Stripe payment error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error.message || 'Payment processing failed' 
    });
  }
});

// ==========================================
// PAYPAL DONATION ENDPOINTS
// ==========================================

// Record PayPal donation (called after client-side capture)
router.post('/paypal', async (req, res) => {
  try {
    const { orderID, amount, currency, payer } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Record the donation
    const saved = saveDonation({
      provider: 'paypal',
      orderId: orderID,
      amount: parseFloat(amount) || 0,
      currency: currency || 'USD',
      payerEmail: payer?.email_address || null,
      payerName: payer?.name?.given_name ? 
        `${payer.name.given_name} ${payer.name.surname || ''}`.trim() : null,
      status: 'completed'
    });

    if (saved) {
      res.json({ 
        success: true, 
        message: 'Donation recorded successfully',
        orderID 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to record donation' 
      });
    }
  } catch (error) {
    console.error('PayPal record error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to record donation' 
    });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// Get all donations (admin only)
router.get('/list', (req, res) => {
  // TODO: Add admin authentication middleware
  try {
    const donations = getDonations();
    res.json({
      success: true,
      count: donations.length,
      donations: donations.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Get donation statistics
router.get('/stats', (req, res) => {
  try {
    const donations = getDonations();
    
    const stats = {
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + (d.amount || 0), 0),
      byProvider: {
        stripe: donations.filter(d => d.provider === 'stripe').length,
        paypal: donations.filter(d => d.provider === 'paypal').length
      },
      recentDonations: donations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donation stats' });
  }
});

module.exports = router;
