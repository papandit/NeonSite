// Admin upload endpoints. Returns a public URL for the stored asset — a
// Cloudinary URL when configured, else a MongoDB-backed /api/assets/:id URL
// (see assetStore). SVG icons are sanitized before storage.

import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { persistAsset, requestOrigin } from '../../services/assets/assetStore.js';
import { sanitizeSvg } from '../../services/cloudinary/sanitizeSvg.js';

function requireFile(req) {
  if (!req.file || !req.file.buffer) {
    throw ApiError.badRequest('No file uploaded (field name must be "file")');
  }
  return req.file;
}

// POST /api/admin/uploads/image  (banners, product images, neon scenes)
export const uploadImageAsset = asyncHandler(async (req, res) => {
  const file = requireFile(req);
  const result = await persistAsset(file.buffer, {
    kind: 'image',
    folder: req.query.folder || 'images',
    contentType: file.mimetype,
    filename: file.originalname,
    baseUrl: requestOrigin(req),
  });
  return sendSuccess(res, result, 201);
});

// POST /api/admin/uploads/font  (ttf/otf/woff)
export const uploadFontAsset = asyncHandler(async (req, res) => {
  const file = requireFile(req);
  const ext = (file.originalname.split('.').pop() || '').toLowerCase();
  const result = await persistAsset(file.buffer, {
    kind: 'font',
    folder: 'fonts',
    contentType: file.mimetype || 'font/ttf',
    filename: file.originalname,
    baseUrl: requestOrigin(req),
  });
  return sendSuccess(res, { ...result, format: result.format || ext }, 201);
});

// POST /api/admin/uploads/svg  (icons — sanitized first)
export const uploadSvgAsset = asyncHandler(async (req, res) => {
  const file = requireFile(req);
  const clean = sanitizeSvg(file.buffer); // throws on invalid/malicious SVG
  const result = await persistAsset(Buffer.from(clean, 'utf8'), {
    kind: 'svg',
    folder: 'icons',
    contentType: 'image/svg+xml',
    filename: file.originalname,
    baseUrl: requestOrigin(req),
  });
  return sendSuccess(res, result, 201);
});
