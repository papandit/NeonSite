// Freezes a re-validated cart + server totals into an Order (INVARIANTS 3,5,8).
// Gapless orderNumber via the atomic counter; append-only statusHistory seeded
// pending -> confirmed. Increments coupon usage and clears the cart.

import Order from '../../models/Order.js';
import Coupon from '../../models/Coupon.js';
import { getSettings } from '../../models/Settings.js';
import { getNextSequence } from '../../models/Counter.js';
import { sendOrderConfirmation } from '../mailer/mailer.js';

export async function createOrderFromQuote({ userId, cart, totals, coupon, address, giftWrap, payment }) {
  const settings = await getSettings();
  const seq = await getNextSequence('orderNumber');
  const orderNumber = `${settings.invoicePrefix}-NC-${String(seq).padStart(6, '0')}`;

  // Need product names for the snapshot.
  await cart.populate('items.product', 'name');

  const items = cart.items.map((it) => ({
    product: it.product?._id || it.product,
    productNameSnapshot: it.product?.name || '',
    designDocument: it.designDocument, // frozen, server-priced, authoritative
    previewImageUrl: it.designDocument?.render?.previewImageUrl || null,
    quantity: it.quantity,
    unitPricePaise: it.unitPricePaise,
    lineTotalPaise: it.unitPricePaise * it.quantity,
  }));

  const now = new Date();
  const order = await Order.create({
    orderNumber,
    user: userId,
    items,
    subtotalPaise: totals.subtotalPaise,
    discountPaise: totals.discountPaise,
    couponSnapshot: totals.coupon.applied ? totals.coupon.snapshot : null,
    shippingPaise: totals.shippingPaise,
    taxPaise: totals.taxPaise,
    totalPaise: totals.totalPaise,
    address,
    giftWrap: Boolean(giftWrap),
    payment,
    statusHistory: [
      { status: 'pending', by: userId, at: now, note: 'Order placed' },
      { status: 'confirmed', by: userId, at: now, note: 'Payment verified' },
    ],
  });

  if (coupon && totals.coupon.applied) {
    await Coupon.updateOne({ _id: coupon._id }, { $inc: { used: 1 } });
  }

  // Clear the cart.
  cart.items = [];
  await cart.save();

  // Best-effort confirmation email (never blocks order creation).
  sendOrderConfirmation(order).catch(() => {});

  return order;
}
