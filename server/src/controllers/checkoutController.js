// POST /api/checkout/quote  (auth)  { couponCode? }
// Recomputes the whole order server-side (subtotal from a re-validated cart,
// discount, GST, shipping, total) — all integer paise. Returns the full
// breakdown for the checkout summary.

import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import { buildQuote } from '../services/checkout/checkoutService.js';

export const checkoutQuote = asyncHandler(async (req, res) => {
  const { couponCode } = req.body || {};
  const { cart, invalidItems, totals } = await buildQuote(req.user.id, { couponCode });

  if (cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty', { code: 'CART_EMPTY' });
  }
  if (invalidItems.length > 0) {
    throw ApiError.badRequest('Some cart items need attention', {
      code: 'CART_INVALID',
      details: invalidItems,
    });
  }

  return sendSuccess(res, {
    subtotalPaise: totals.subtotalPaise,
    discountPaise: totals.discountPaise,
    taxablePaise: totals.taxablePaise,
    taxPaise: totals.taxPaise,
    gstRatePercent: totals.gstRatePercent,
    shippingPaise: totals.shippingPaise,
    totalPaise: totals.totalPaise,
    coupon: totals.coupon,
    itemCount: cart.items.reduce((n, it) => n + it.quantity, 0),
  });
});
