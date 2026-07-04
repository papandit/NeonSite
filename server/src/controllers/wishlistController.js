// Per-user wishlist (auth). Persists server-side.

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Wishlist from '../models/Wishlist.js';

async function getOrCreate(userId) {
  let w = await Wishlist.findOne({ user: userId });
  if (!w) w = await Wishlist.create({ user: userId, products: [] });
  return w;
}

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const w = await getOrCreate(req.user.id);
  await w.populate('products', 'name slug images basePricePaise rating status');
  const products = w.products.filter((p) => p && p.status === 'active');
  return sendSuccess(res, { products, ids: products.map((p) => String(p._id)) });
});

// POST /api/wishlist/toggle  { productId }
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) throw ApiError.badRequest('A valid productId is required');

  const w = await getOrCreate(req.user.id);
  const idx = w.products.findIndex((p) => String(p) === String(productId));
  let wishlisted;
  if (idx >= 0) {
    w.products.splice(idx, 1);
    wishlisted = false;
  } else {
    w.products.push(productId);
    wishlisted = true;
  }
  await w.save();
  return sendSuccess(res, { productId, wishlisted, ids: w.products.map((p) => String(p)) });
});
