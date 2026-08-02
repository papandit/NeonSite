// Reviews: customers create (pending), admins moderate, product rating is
// recomputed from approved reviews.

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { persistAsset } from '../services/assets/assetStore.js';
import { REVIEW_MEDIA_MAX, reviewMediaLimit } from '../middleware/upload.js';

// POST /api/reviews  (auth)  { productId, rating, title, comment }
export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) throw ApiError.badRequest('A valid productId is required');
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw ApiError.badRequest('rating must be 1–5');

  const product = await Product.findById(productId).select('_id');
  if (!product) throw ApiError.notFound('Product not found');

  // Attachments are uploaded first (POST /api/reviews/media) and referenced
  // here by their asset URL, so a slow upload never holds the review open and
  // a failed submit doesn't lose the files.
  const media = Array.isArray(req.body?.media) ? req.body.media : [];
  if (media.length > REVIEW_MEDIA_MAX) throw ApiError.badRequest(`Up to ${REVIEW_MEDIA_MAX} attachments`);
  const cleanMedia = media
    .filter((m) => m && (m.type === 'image' || m.type === 'video'))
    // Only our own asset URLs — never let a review embed a third-party host.
    .filter((m) => typeof m.url === 'string' && /^\/api\/assets\/[a-f0-9]{24}$/i.test(m.url))
    .slice(0, REVIEW_MEDIA_MAX)
    .map((m) => ({ type: m.type, url: m.url, bytes: Number(m.bytes) || 0 }));

  const review = await Review.create({
    product: productId,
    user: req.user.id,
    userNameSnapshot: req.user.name,
    rating: r,
    title,
    comment,
    media: cleanMedia,
    status: 'approved', // visible immediately; admin can still moderate/remove
  });
  // Reflect the new review in the product's rating and count right away.
  await Review.recomputeProductRating(productId);
  return sendSuccess(res, review, 201);
});

// POST /api/reviews/media  (auth, rate limited) — multipart "files"
// Stores each attachment through the normal asset pipeline and returns the
// descriptors the client then posts with the review.
export const uploadReviewFiles = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw ApiError.badRequest('No files uploaded');

  const saved = [];
  for (const file of files) {
    const limit = reviewMediaLimit(file.mimetype);
    if (!limit) throw ApiError.badRequest(`Unsupported file type: ${file.mimetype}`);
    // Multer enforces the larger video ceiling for every file, so the image
    // limit has to be checked here, now that we know what this one is.
    if (file.size > limit.max) {
      throw ApiError.badRequest(
        `${limit.kind === 'video' ? 'Videos' : 'Photos'} must be under ${Math.round(limit.max / (1024 * 1024))}MB`,
        { code: 'FILE_TOO_LARGE' },
      );
    }
    const asset = await persistAsset(file.buffer, {
      kind: 'image', // storage kind; contentType is what decides how it serves
      folder: 'reviews',
      contentType: file.mimetype,
      filename: file.originalname || '',
    });
    saved.push({ type: limit.kind, url: asset.url, bytes: asset.bytes });
  }

  return sendSuccess(res, saved, 201);
});

// GET /api/products/:slug/reviews  (public — approved only)
export const listProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('_id');
  if (!product) throw ApiError.notFound('Product not found');
  const reviews = await Review.find({ product: product._id, status: 'approved' })
    .sort('-createdAt')
    .select('rating title comment media userNameSnapshot createdAt user')
    .lean();

  // `mine` lets the client offer a Remove button without exposing whose review
  // belongs to which account — the raw user id never leaves the server.
  const viewer = req.user?.id ? String(req.user.id) : null;
  const shaped = reviews.map(({ user, ...r }) => ({ ...r, mine: viewer !== null && String(user) === viewer }));

  return sendSuccess(res, shaped);
});

// DELETE /api/reviews/:id  (auth) — a customer removes their own review; an
// admin may remove any. The product's rating and count are recomputed so the
// listing never keeps counting a review that no longer exists.
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Review not found');

  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');

  const isOwner = String(review.user) === String(req.user.id);
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden('You can only remove your own review');

  const productId = review.product;
  await review.deleteOne();
  const { rating, count } = await Review.recomputeProductRating(productId);

  return sendSuccess(res, { removed: true, productRating: rating, approvedCount: count });
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
