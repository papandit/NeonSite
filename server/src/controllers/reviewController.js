// Reviews: customers create (pending), admins moderate, product rating is
// recomputed from approved reviews.

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

// POST /api/reviews  (auth)  { productId, rating, title, comment }
export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) throw ApiError.badRequest('A valid productId is required');
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw ApiError.badRequest('rating must be 1–5');

  const product = await Product.findById(productId).select('_id');
  if (!product) throw ApiError.notFound('Product not found');

  try {
    const review = await Review.create({
      product: productId,
      user: req.user.id,
      userNameSnapshot: req.user.name,
      rating: r,
      title,
      comment,
      status: 'pending',
    });
    return sendSuccess(res, review, 201);
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('You have already reviewed this product');
    throw err;
  }
});

// GET /api/products/:slug/reviews  (public — approved only)
export const listProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('_id');
  if (!product) throw ApiError.notFound('Product not found');
  const reviews = await Review.find({ product: product._id, status: 'approved' })
    .sort('-createdAt')
    .select('rating title comment userNameSnapshot createdAt')
    .lean();
  return sendSuccess(res, reviews);
});

// --- Admin moderation ---

// GET /api/admin/reviews?status=
export const adminListReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const reviews = await Review.find(filter)
    .sort('-createdAt')
    .populate('product', 'name slug')
    .populate('user', 'name email')
    .lean();
  return sendSuccess(res, reviews);
});

// PATCH /api/admin/reviews/:id/moderate  { status }
export const moderateReview = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) throw ApiError.badRequest('Invalid status');

  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  review.status = status;
  await review.save();

  // Recompute the product's rating from approved reviews.
  const { rating, count } = await Review.recomputeProductRating(review.product);

  return sendSuccess(res, { review, productRating: rating, approvedCount: count });
});
