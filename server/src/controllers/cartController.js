// Cart (auth). INVARIANT 2: EVERY write re-validates + re-prices the design via
// the shared quoteDesign pipeline and stores the SERVER unitPricePaise. A
// tampered client price is discarded.

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import { quoteDesign } from '../services/pricing/quoteDesign.js';
import { getOrCreateCart, serializeCart } from '../services/cart/cartService.js';

async function repriceOrThrow(productId, designDocument) {
  const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found');
  const { errors, designDocument: corrected } = await quoteDesign(product, designDocument);
  if (errors.length > 0) {
    throw ApiError.badRequest('Design is invalid', { code: 'DESIGN_INVALID', details: errors });
  }
  return corrected;
}

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  return sendSuccess(res, await serializeCart(cart));
});

// POST /api/cart  { productId, designDocument, quantity }
export const addItem = asyncHandler(async (req, res) => {
  const { productId, designDocument, quantity = 1 } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('A valid productId is required');
  }
  if (!designDocument || typeof designDocument !== 'object') {
    throw ApiError.badRequest('designDocument is required');
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const corrected = await repriceOrThrow(productId, designDocument);

  const cart = await getOrCreateCart(req.user.id);
  cart.items.push({
    product: productId,
    designDocument: corrected,
    quantity: qty,
    unitPricePaise: corrected.pricing.subtotalPaise, // SERVER price
  });
  await cart.save();
  return sendSuccess(res, await serializeCart(cart), 201);
});

// PATCH /api/cart/:itemId  { quantity?, designDocument? }
export const updateItem = asyncHandler(async (req, res) => {
  const { quantity, designDocument } = req.body || {};
  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (designDocument && typeof designDocument === 'object') {
    const corrected = await repriceOrThrow(item.product, designDocument);
    item.designDocument = corrected;
    item.unitPricePaise = corrected.pricing.subtotalPaise; // re-priced
  }
  if (quantity !== undefined) {
    item.quantity = Math.max(1, parseInt(quantity, 10) || 1);
  }
  await cart.save();
  return sendSuccess(res, await serializeCart(cart));
});

// DELETE /api/cart/:itemId
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.deleteOne();
  await cart.save();
  return sendSuccess(res, await serializeCart(cart));
});

// DELETE /api/cart  (clear)
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = [];
  await cart.save();
  return sendSuccess(res, await serializeCart(cart));
});
