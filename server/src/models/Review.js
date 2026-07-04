import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ReviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userNameSnapshot: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

// One review per user per product.
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

/**
 * Recompute a product's average rating from its APPROVED reviews and persist it.
 * @param {import('mongoose').Types.ObjectId|string} productId
 */
ReviewSchema.statics.recomputeProductRating = async function recompute(productId) {
  const Product = mongoose.model('Product');
  const [agg] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const rating = agg ? Math.round(agg.avg * 10) / 10 : 0;
  await Product.findByIdAndUpdate(productId, { rating });
  return { rating, count: agg?.count || 0 };
};

const Review = model('Review', ReviewSchema);
export default Review;
