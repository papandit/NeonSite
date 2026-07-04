// POST /api/coupons/apply  (auth)  { code }
// Validates a coupon against the user's current cart subtotal and returns the
// server-computed discount (integer paise). One coupon per order.

import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Coupon from '../models/Coupon.js';
import { getOrCreateCart, cartSubtotalPaise } from '../services/cart/cartService.js';
import { evaluateCoupon } from '../services/coupon/evaluateCoupon.js';

export const applyCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body?.code || '').toUpperCase().trim();
  if (!code) throw ApiError.badRequest('Coupon code is required');

  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw ApiError.notFound('Invalid coupon code', { code: 'COUPON_NOT_FOUND' });

  const cart = await getOrCreateCart(req.user.id);
  const subtotalPaise = cartSubtotalPaise(cart);

  const result = evaluateCoupon(coupon, subtotalPaise, new Date());
  if (!result.ok) {
    throw ApiError.badRequest(result.reason, { code: 'COUPON_INVALID' });
  }

  return sendSuccess(res, {
    code: coupon.code,
    type: coupon.type,
    discountPaise: result.discountPaise,
    subtotalPaise,
  });
});
