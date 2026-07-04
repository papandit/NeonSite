// Razorpay integration (INVARIANT 6). Works in two modes:
//  - LIVE: real Razorpay SDK when keys are configured.
//  - MOCK: when keys are absent (local dev), fabricate an order id and, on
//    verify, generate a valid HMAC so the full flow completes without real keys.
// The signature check is identical in both modes — only the secret differs.

import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import config from '../../config/index.js';

const MOCK_SECRET = 'nc_mock_secret';

function isConfigured() {
  return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
}

export function paymentsMode() {
  return isConfigured() ? 'live' : 'mock';
}

let client = null;
function getClient() {
  if (!client) {
    client = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
  }
  return client;
}

/**
 * Create a payment order for an amount in PAISE (Razorpay uses paise for INR).
 * @returns {Promise<{ id, amount, currency, keyId, mock }>}
 */
export async function createPaymentOrder(amountPaise, receipt) {
  if (isConfigured()) {
    const order = await getClient().orders.create({ amount: amountPaise, currency: 'INR', receipt });
    return { id: order.id, amount: order.amount, currency: order.currency, keyId: config.razorpay.keyId, mock: false };
  }
  const id = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
  return { id, amount: amountPaise, currency: 'INR', keyId: 'rzp_test_mock', mock: true };
}

function sign(orderId, paymentId, secret) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

/** Constant-time signature verification. */
export function verifySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const secret = isConfigured() ? config.razorpay.keySecret : MOCK_SECRET;
  const expected = sign(orderId, paymentId, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** MOCK-only: produce a valid (paymentId, signature) pair so dev checkout works. */
export function mockPayment(orderId) {
  const paymentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
  const signature = sign(orderId, paymentId, MOCK_SECRET);
  return { paymentId, signature };
}
