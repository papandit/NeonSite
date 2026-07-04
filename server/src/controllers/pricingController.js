// POST /api/pricing/quote  (public)
// Server-authoritative pricing. Delegates to the shared quoteDesign pipeline
// (also used by the cart), so pricing is identical everywhere.

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import { quoteDesign } from '../services/pricing/quoteDesign.js';

export const quote = asyncHandler(async (req, res) => {
  const { productId, designDocument } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('A valid productId is required');
  }
  if (!designDocument || typeof designDocument !== 'object') {
    throw ApiError.badRequest('designDocument is required');
  }

  const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found');

  const { errors, designDocument: corrected } = await quoteDesign(product, designDocument);
  if (errors.length > 0) {
    throw ApiError.badRequest('Design is invalid', { code: 'DESIGN_INVALID', details: errors });
  }

  return sendSuccess(res, { designDocument: corrected });
});
