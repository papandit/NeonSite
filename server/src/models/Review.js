import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Photos and clips a reviewer attached. `url` points at our own asset store
// (/api/assets/:id) — never a third-party host — so media can't disappear and
// doesn't leak a viewer's IP to someone else's CDN.
const MediaSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    bytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const ReviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userNameSnapshot: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, trim: true, maxlength: 2000 },
    media: { type: [MediaSchema], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

// A customer may review the same product more than once — people come back
// after living with a piece, or buy it again as a gift. The pair stays indexed
// for lookup but is deliberately NOT unique; rate limiting is what stops abuse
// here, not the schema. Run scripts/dropReviewUniqueIndex.js once on an
// existing database to remove the old unique constraint.
ReviewSchema.index({ product: 1, user: 1 });
ReviewSchema.index({ user: 1, createdAt: -1 });

/**
 * Recompute a product's rating AND review count from its APPROVED reviews.
 * Both are denormalised onto the product so a listing can sort by them without
 * running an aggregate per request.
 * @param {import('mongoose').Types.ObjectId|string} productId
 */
ReviewSchema.statics.recomputeProductRating = async function recompute(productId) {
  const Product = mongoose.model('Product');
  const [agg] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const rating = agg ? Math.round(agg.avg * 10) / 10 : 0;
  const numReviews = agg?.count || 0;
  await Product.findByIdAndUpdate(productId, { rating, numReviews });
  return { rating, count: numReviews };
};

const Review = model('Review', ReviewSchema);
export default Review;
