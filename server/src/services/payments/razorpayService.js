// Razorpay integration (INVARIANT 6). Works in two modes:
//  - LIVE: real Razorpay SDK when keys are configured.
//  - MOCK: when keys are absent (local dev only), fabricate an order id and, on
//    verify, generate a valid HMAC so the full flow completes without real keys.
// The signature check is identical in both modes — only the secret differs.
//
// SECURITY: the mock secret is in this file, so anyone reading the source can
// forge a "valid" signature. Mock mode is therefore hard-gated to
// non-production: in production, missing keys mean payments are DOWN, not
// free. Without that gate, clearing the Razorpay keys — by accident or by an
// attacker with settings access — would turn every checkout into a free order.

import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import config from '../../config/index.js';
import { getIntegrations } from '../settings/integrations.js';

const MOCK_SECRET = 'nc_mock_secret';

/** Mock payments are a local-dev affordance and never available in production. */
export const mockAllowed = () => !config.isProd;

async function rzp() {
  return (await getIntegrations()).razorpay;
}
const isLive = (r) => Boolean(r.keyId && r.keySecret);

export async function paymentsMode() {
  if (isLive(await rzp())) return 'live';
  // Unconfigured in production is an outage, not an invitation.
  return mockAllowed() ? 'mock' : 'unconfigured';
}

/**
 * Create a payment order for an amount in PAISE (Razorpay uses paise for INR).
 * @returns {Promise<{ id, amount, currency, keyId, mock }>}
 */
export async function createPaymentOrder(amountPaise, receipt) {
  const r = await rzp();
  if (isLive(r)) {
    const client = new Razorpay({ key_id: r.keyId, key_secret: r.keySecret });
    const order = await client.orders.create({ amount: amountPaise, currency: 'INR', receipt });
    return { id: order.id, amount: order.amount, currency: order.currency, keyId: r.keyId, mock: false };
  }
  if (!mockAllowed()) {
    throw new Error('Razorpay is not configured — payments are unavailable');
  }
  const id = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
  return { id, amount: amountPaise, currency: 'INR', keyId: 'rzp_test_mock', mock: true };
}

function sign(orderId, paymentId, secret) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

/** Constant-time signature verification. */
export async function verifySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const r = await rzp();
  // Never fall back to the published mock secret in production.
  if (!isLive(r) && !mockAllowed()) return false;
  const secret = isLive(r) ? r.keySecret : MOCK_SECRET;
  const expected = sign(orderId, paymentId, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** MOCK-only: produce a valid (paymentId, signature) pair so dev checkout works. */
export function mockPayment(orderId) {
  if (!mockAllowed()) throw new Error('Mock payments are disabled');
  const paymentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
  const signature = sign(orderId, paymentId, MOCK_SECRET);
  return { paymentId, signature };
}
