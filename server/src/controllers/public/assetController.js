// GET /api/assets/:id (public) — stream a MongoDB-stored asset. CORS-open and
// long-cached so it works in <img crossorigin>, CSS backgrounds, and the Fabric
// preview canvas (toDataURL needs a CORS-clean image).
//
// The id is immutable and so are the bytes behind it, so a conditional request
// is answered from the metadata alone and never loads the buffer out of Mongo.
// That turns a repeat view of a product grid into a handful of 304s instead of
// megabytes of body.

import mongoose from 'mongoose';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import Asset from '../../models/Asset.js';

export const getAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Asset not found');

  // Metadata first — cheap, and enough to answer a conditional request.
  const meta = await Asset.findById(id, { data: 0 }).lean();
  if (!meta) throw ApiError.notFound('Asset not found');

  // Content changes only via a re-encode, which moves both `bytes` and
  // `updatedAt`, so the pair identifies this exact body.
  const etag = `"${id}-${meta.bytes || 0}-${new Date(meta.updatedAt || 0).getTime()}"`;
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('ETag', etag);
  if (meta.updatedAt) res.set('Last-Modified', new Date(meta.updatedAt).toUTCString());
  res.set('Content-Type', meta.contentType || 'application/octet-stream');

  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  const asset = await Asset.findById(id, { data: 1 }).lean();
  if (!asset) throw ApiError.notFound('Asset not found');

  const body = asset.data?.buffer ? Buffer.from(asset.data.buffer) : asset.data;
  res.set('Content-Length', String(body.length));
  return res.send(body);
});
