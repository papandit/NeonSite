import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from './plugins/moneyGuard.js';

const { Schema, model } = mongoose;

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['flat', 'percentage'], required: true },
    valuePaise: paiseField({ default: 0 }), // for type 'flat'
    percent: { type: Number, default: 0, min: 0, max: 100 }, // for type 'percentage'
    minSubtotalPaise: paiseField({ default: 0 }),
    maxDiscountPaise: paiseField({ default: 0 }), // 0 = no cap (percentage coupons)
    expiresAt: { type: Date },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    used: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

CouponSchema.plugin(moneyGuardPlugin);

const Coupon = model('Coupon', CouponSchema);
export default Coupon;
