// Checkout orchestration: re-validate the cart from live prices (the §6
// validation gate), then compute the full total breakdown. Used by BOTH
// /checkout/quote and the Razorpay order creation, so the amount charged is
// always the server total.

import Product from '../../models/Product.js';
import Coupon from '../../models/Coupon.js';
import { getSettings } from '../../models/Settings.js';
import { quoteDesign } from '../pricing/quoteDesign.js';
import { getOrCreateCart, cartSubtotalPaise } from '../cart/cartService.js';
import { computeTotals } from './computeTotals.js';

/**
 * Re-price every cart item from live DB prices; persists corrected prices.
 * @returns {Promise<{ cart, subtotalPaise, invalidItems: Array<{itemId,errors}> }>}
 */
export async function revalidateCart(userId) {
  const cart = await getOrCreateCart(userId);
  const invalidItems = [];
  let changed = false;

  for (const item of cart.items) {
    const product = await Product.findOne({ _id: item.product, status: 'active' }).lean();
    if (!product) {
      invalidItems.push({ itemId: String(item._id), errors: ['Product no longer available'] });
      continue;
    }
    const { errors, designDocument } = await quoteDesign(product, item.designDocument);
    if (errors.length > 0) {
      invalidItems.push({ itemId: String(item._id), errors });
      continue;
    }
    if (item.unitPricePaise !== designDocument.pricing.subtotalPaise) changed = true;
    item.designDocument = designDocument;
    item.unitPricePaise = designDocument.pricing.subtotalPaise;
  }

  if (changed) await cart.save();
  return { cart, subtotalPaise: cartSubtotalPaise(cart), invalidItems };
}

/**
 * Build the authoritative checkout quote.
 * @param {string} userId
 * @param {{ couponCode?: string }} opts
 */
export async function buildQuote(userId, { couponCode } = {}) {
  const { cart, subtotalPaise, invalidItems } = await revalidateCart(userId);
  const settings = await getSettings();

  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
  }

  const totals = computeTotals({ subtotalPaise, coupon, settings });

  return { cart, invalidItems, settings, coupon, totals };
}
