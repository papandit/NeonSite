import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from './plugins/moneyGuard.js';

const { Schema, model } = mongoose;

// unitPricePaise is ALWAYS the server-computed designDocument.pricing.subtotalPaise
// (INVARIANT 2 — never trusted from the client).
const CartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    designDocument: { type: Schema.Types.Mixed, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPricePaise: paiseField({ required: true }),
  },
  { _id: true, timestamps: true }
);

CartItemSchema.plugin(moneyGuardPlugin);

const CartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

const Cart = model('Cart', CartSchema);
export default Cart;
