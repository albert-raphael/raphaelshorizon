# PayPal Integration & Subscription Setup 🔧

This document explains how to enable live PayPal payments and subscriptions for the backend.

## Required environment variables
- `PAYPAL_CLIENT_ID` — your PayPal REST client ID
- `PAYPAL_SECRET` — your PayPal REST client secret
- `PAYPAL_MODE` — `sandbox` or `live` (optional; defaults to `live` when not set)

Set these in your hosting environment (Vercel, GitHub Actions secrets, etc.).

## Endpoints
- `GET /api/payments/config` — returns provider availability and client ID for client-side SDK loading
- `POST /api/payments/create` — creates a PayPal order server-side and returns the order payload
- `POST /api/payments/capture` — captures an order and attaches a simulated 30-day subscription to the authenticated user (or real capture when PayPal credentials are present)
- `POST /api/payments/create-subscription` — (authenticated) creates a subscription; when live, returns an approval link; in test-mode/simulate, activates a simulated subscription immediately
- `POST /api/payments/subscriptions/confirm` — (authenticated) confirm a subscription after approval; fetches subscription details from PayPal and attaches to user when active
- `POST /api/payments/webhook` — webhook listener (verifies signature when `PAYPAL_WEBHOOK_ID` is set and handles subscription events to update user records)
- `GET /api/subscriptions/status` — (authenticated) returns the user's subscription object and `isActive` boolean
- `POST /api/subscriptions/create` — (authenticated) creates a simulated subscription if PayPal not configured; otherwise instructs to use payments endpoints
- `POST /api/subscriptions/cancel` — (authenticated) cancels subscription

## Notes & Next steps
- In production, implement full webhook verification (PayPal transmission signature) and server-side subscription lifecycle handling (e.g., handling recurring payments, renewals, cancellations). We added optional webhook verification using PayPal's `/v1/notifications/verify-webhook-signature` when `PAYPAL_WEBHOOK_ID` is set.
- The capture flow currently assigns a 30-day period as a default; update to use real data from PayPal when implementing subscriptions.
- Tests: e2e smoke tests are added under `tools/e2e/tests` and CI will record Playwright artifacts on failures. For CI we also support a **test-mode** that simulates create/capture flows without requiring a PayPal UI approval by setting `PAYPAL_TEST_MODE=simulate` in the workflow environment.

If you want, I can implement full PayPal subscription flows (create subscription plans, billing agreements, and webhooks) and extend E2E flows to drive the PayPal sandbox UI once you confirm test buyer credentials for automated approval. ✅
