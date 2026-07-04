// Pure order-total calculator (INVARIANT 1). Applied in a fixed order; rounding
// happens ONLY on the final tax line. All values integer paise.

import { evaluateCoupon } from '../coupon/evaluateCoupon.js';

/**
 * @param {object} args
 * @param {number} args.subtotalPaise    re-validated cart subtotal
 * @param {object|null} args.coupon      coupon doc or null
 * @param {object} args.settings         { gstRatePercent, shipping:{ flatPaise, freeAbovePaise } }
 * @param {Date} [args.now]
 * @returns {{ subtotalPaise, discountPaise, taxablePaise, taxPaise, shippingPaise, totalPaise, coupon:{applied,reason,snapshot}, gstRatePercent }}
 */
export function computeTotals({ subtotalPaise, coupon, settings, now = new Date() }) {
  let discountPaise = 0;
  let couponResult = { applied: false, reason: null, snapshot: null };

  if (coupon) {
    const evalRes = evaluateCoupon(coupon, subtotalPaise, now);
    if (evalRes.ok) {
      discountPaise = evalRes.discountPaise;
      couponResult = {
        applied: true,
        reason: null,
        snapshot: {
          code: coupon.code,
          type: coupon.type,
          valuePaise: coupon.valuePaise,
          percent: coupon.percent,
          discountPaise,
        },
      };
    } else {
      couponResult = { applied: false, reason: evalRes.reason, snapshot: null };
    }
  }

  const taxablePaise = Math.max(0, subtotalPaise - discountPaise);

  const gstRatePercent = settings?.gstRatePercent ?? 0;
  const taxPaise = Math.round((taxablePaise * gstRatePercent) / 100); // round ONLY here

  const flat = settings?.shipping?.flatPaise ?? 0;
  const freeAbove = settings?.shipping?.freeAbovePaise ?? 0;
  let shippingPaise = 0;
  if (taxablePaise > 0) {
    shippingPaise = freeAbove > 0 && taxablePaise >= freeAbove ? 0 : flat;
  }

  const totalPaise = taxablePaise + taxPaise + shippingPaise;

  return {
    subtotalPaise,
    discountPaise,
    taxablePaise,
    taxPaise,
    shippingPaise,
    totalPaise,
    gstRatePercent,
    coupon: couponResult,
  };
}

export default computeTotals;
