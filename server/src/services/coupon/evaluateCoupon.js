// Pure coupon evaluation (INVARIANT 1: integer paise; % uses floor). Returns
// { ok, reason, discountPaise }. `now` is injected so it's deterministic.

/**
 * @param {object} coupon
 * @param {number} subtotalPaise
 * @param {Date} now
 * @returns {{ ok: boolean, reason?: string, discountPaise: number }}
 */
export function evaluateCoupon(coupon, subtotalPaise, now = new Date()) {
  if (!coupon || coupon.status !== 'active') {
    return { ok: false, reason: 'Coupon is not active', discountPaise: 0 };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime()) {
    return { ok: false, reason: 'Coupon has expired', discountPaise: 0 };
  }
  if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.used >= coupon.usageLimit) {
    return { ok: false, reason: 'Coupon usage limit reached', discountPaise: 0 };
  }
  if (coupon.minSubtotalPaise && subtotalPaise < coupon.minSubtotalPaise) {
    return {
      ok: false,
      reason: `Minimum order of ₹${(coupon.minSubtotalPaise / 100).toFixed(2)} required`,
      discountPaise: 0,
    };
  }

  let discount;
  if (coupon.type === 'flat') {
    discount = coupon.valuePaise || 0;
  } else {
    // percentage — floor to whole paise (INVARIANT 1)
    discount = Math.floor((subtotalPaise * (coupon.percent || 0)) / 100);
    if (coupon.maxDiscountPaise && coupon.maxDiscountPaise > 0) {
      discount = Math.min(discount, coupon.maxDiscountPaise);
    }
  }
  // Never discount more than the subtotal.
  discount = Math.min(discount, subtotalPaise);

  return { ok: true, discountPaise: discount };
}

export default evaluateCoupon;
