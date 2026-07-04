// Admin upload endpoints. Each returns the secure Cloudinary URL. SVG icons are
// sanitized before upload.

import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { uploadBuffer } from '../../services/cloudinary/index.js';
import { sanitizeSvg } from '../../services/cloudinary/sanitizeSvg.js';

function requireFile(req) {
  if (!req.file || !req.file.buffer) {
    throw ApiError.badRequest('No file uploaded (field name must be "file")');
  }
  return req.file;
}

// POST /api/admin/uploads/image  (banners, product images)
export const uploadImageAsset = asyncHandler(async (req, res) => {
  const file = requireFile(req);
  const folder = `namecraft/${req.query.folder || 'images'}`;
  const result = await uploadBuffer(file.buffer, { folder, resourceType: 'image' });
  return sendSuccess(res, result, 201);
});

// POST /api/admin/uploads/font  (ttf/otf/woff)
export const uploadFontAsset = asyncHandler(async (req, res) => {
  const file = requireFile(req);
  const result = await uploadBuffer(file.buffer, {
    folder: 'namecraft/fonts',
    resourceType: 'raw',
  });
  const ext = (file.originalname.split('.').pop() || '').toLowerCase();
  return sendSuccess(res, { ...result, format: ext }, 201);
});

// POST /api/admin/uploads/svg  (icons — sanitized first)
export const uploadSvgAsset = asyncHandler(async (req, res) => {
  const file = requireFile(req);
  const clean = sanitizeSvg(file.buffer); // throws on invalid/malicious SVG
  const result = await uploadBuffer(Buffer.from(clean, 'utf8'), {
    folder: 'namecraft/icons',
    resourceType: 'image', // Cloudinary treats svg as image
  });
  return sendSuccess(res, result, 201);
});
