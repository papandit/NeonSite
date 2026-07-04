// Order — a FROZEN snapshot at purchase (INVARIANTS 3,4,5,8). Items carry a
// frozen designDocument + snapshots + preview; status is append-only.

import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from './plugins/moneyGuard.js';

const { Schema, model } = mongoose;

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'design_review', 'approved',
  'manufacturing', 'packed', 'shipped', 'delivered', 'cancelled',
];

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    productNameSnapshot: String,
    designDocument: { type: Schema.Types.Mixed, required: true }, // frozen; pricing.authoritative=true
    previewImageUrl: String,
    productionRenderUrl: String, // filled by the render service later
    quantity: { type: Number, default: 1, min: 1 },
    unitPricePaise: paiseField({ required: true }),
    lineTotalPaise: paiseField({ required: true }),
  },
  { _id: true }
);

const StatusEntrySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: String,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true, index: true }, // gapless (Counter)
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [OrderItemSchema], default: [] },

    subtotalPaise: paiseField({ required: true }),
    discountPaise: paiseField({ default: 0 }),
    couponSnapshot: { type: Schema.Types.Mixed, default: null },
    shippingPaise: paiseField({ default: 0 }),
    taxPaise: paiseField({ default: 0 }),
    totalPaise: paiseField({ required: true }),

    address: { type: Schema.Types.Mixed, required: true }, // snapshot, not a ref
    giftWrap: { type: Boolean, default: false },

    payment: {
      provider: { type: String, default: 'razorpay' },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      verified: { type: Boolean, default: false },
      mock: { type: Boolean, default: false },
    },

    // Append-only. Current status = statusHistory[last].status
    statusHistory: { type: [StatusEntrySchema], default: [] },
  },
  { timestamps: true }
);

OrderSchema.plugin(moneyGuardPlugin);

// Convenience virtual for the current status.
OrderSchema.virtual('status').get(function () {
  const h = this.statusHistory;
  return h && h.length ? h[h.length - 1].status : undefined;
});
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

const Order = model('Order', OrderSchema);
export default Order;
