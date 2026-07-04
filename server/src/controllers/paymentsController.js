// Razorpay payments (INVARIANT 6). The order amount comes ONLY from the server
// checkout total; the signature is verified server-side BEFORE an Order exists.

import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import { buildQuote } from '../services/checkout/checkoutService.js';
import {
  createPaymentOrder,
  verifySignature,
  mockPayment,
  paymentsMode,
} from '../services/payments/razorpayService.js';
import { createOrderFromQuote } from '../services/orders/createOrder.js';

// POST /api/payments/razorpay/order  { couponCode? }
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { couponCode } = req.body || {};
  const { cart, invalidItems, totals } = await buildQuote(req.user.id, { couponCode });

  if (cart.items.length === 0) throw ApiError.badRequest('Your cart is empty', { code: 'CART_EMPTY' });
  if (invalidItems.length > 0) {
    throw ApiError.badRequest('Some cart items need attention', { code: 'CART_INVALID', details: invalidItems });
  }

  const rzpOrder = await createPaymentOrder(totals.totalPaise, `rcpt_${req.user.id}_${Date.now()}`);

  return sendSuccess(res, {
    order: rzpOrder, // { id, amount, currency, keyId, mock }
    totals,
    mode: paymentsMode(),
  });
});

// POST /api/payments/razorpay/verify
// { razorpayOrderId, razorpayPaymentId, razorpaySignature, mock?, address, giftWrap?, couponCode? }
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    mock,
    address,
    giftWrap = false,
    couponCode,
  } = req.body || {};

  if (!razorpayOrderId) throw ApiError.badRequest('razorpayOrderId is required');
  if (!address || typeof address !== 'object') throw ApiError.badRequest('A shipping address is required');

  // In mock mode the client can't produce a signature — synthesize a valid one.
  let paymentId = razorpayPaymentId;
  let signature = razorpaySignature;
  const isMock = paymentsMode() === 'mock' && mock;
  if (isMock) {
    const m = mockPayment(razorpayOrderId);
    paymentId = m.paymentId;
    signature = m.signature;
  }

  if (!verifySignature({ orderId: razorpayOrderId, paymentId, signature })) {
    throw ApiError.badRequest('Payment signature verification failed', { code: 'SIGNATURE_INVALID' });
  }

  // Recompute the whole order server-side (source of truth) before freezing.
  const { cart, invalidItems, totals, coupon } = await buildQuote(req.user.id, { couponCode });
  if (cart.items.length === 0) throw ApiError.badRequest('Your cart is empty', { code: 'CART_EMPTY' });
  if (invalidItems.length > 0) {
    throw ApiError.badRequest('Some cart items need attention', { code: 'CART_INVALID', details: invalidItems });
  }

  const order = await createOrderFromQuote({
    userId: req.user.id,
    cart,
    totals,
    coupon: totals.coupon.applied ? coupon : null,
    address,
    giftWrap,
    payment: {
      provider: 'razorpay',
      razorpayOrderId,
      razorpayPaymentId: paymentId,
      verified: true,
      mock: Boolean(isMock),
    },
  });

  return sendSuccess(res, { order }, 201);
});
