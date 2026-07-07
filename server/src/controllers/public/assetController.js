// GET /api/assets/:id (public) — stream a MongoDB-stored asset. CORS-open and
// long-cached so it works in <img crossorigin>, CSS backgrounds, and the Fabric
// preview canvas (toDataURL needs a CORS-clean image).

import mongoose from 'mongoose';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import Asset from '../../models/Asset.js';

export const getAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Asset not found');

  const asset = await Asset.findById(id).lean();
  if (!asset) throw ApiError.notFound('Asset not found');

  res.set('Content-Type', asset.contentType || 'application/octet-stream');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  return res.send(asset.data.buffer ? Buffer.from(asset.data.buffer) : asset.data);
});
