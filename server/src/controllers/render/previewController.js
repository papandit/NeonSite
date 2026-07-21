// POST /api/render/preview-upload  { dataUrl }
// Server-side preview upload (INVARIANT 7). The browser generates the preview
// (Fabric canvas.toDataURL) and posts the data URL here; the server uploads it
// to Cloudinary and returns the secure URL. If Cloudinary isn't configured
// (local dev), the data URL is echoed back so the flow still completes.

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { uploadBuffer, isCloudinaryConfigured } from '../../services/cloudinary/index.js';
import { persistAsset, requestOrigin } from '../../services/assets/assetStore.js';

const DATA_URL_RE = /^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

export const uploadPreview = asyncHandler(async (req, res) => {
  const { dataUrl } = req.body || {};
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    throw ApiError.badRequest('A base64 image dataUrl is required');
  }
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) throw ApiError.badRequest('Unsupported image data URL');

  const buffer = Buffer.from(match[3], 'base64');
  // Guard against oversized previews (~4MB of base64).
  if (buffer.length > 4 * 1024 * 1024) {
    throw ApiError.badRequest('Preview image too large', { code: 'PREVIEW_TOO_LARGE' });
  }

  if (!isCloudinaryConfigured()) {
    // Local dev fallback — return the data URL as the "stored" preview.
    return sendSuccess(res, { url: dataUrl, stored: false }, 201);
  }

  const result = await uploadBuffer(buffer, { folder: 'namecraft/previews', resourceType: 'image' });
  return sendSuccess(res, { url: result.url, stored: true }, 201);
});

// POST /api/render/customer-upload  { dataUrl }
// A customer-supplied image (e.g. their own name-plate background). Stored via
// the shared asset store so we get a short URL instead of embedding megabytes of
// base64 in the design document. Public — guests can design before signing in.
const CUSTOMER_MAX_BYTES = 8 * 1024 * 1024;
export const uploadCustomerImage = asyncHandler(async (req, res) => {
  const { dataUrl } = req.body || {};
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    throw ApiError.badRequest('An image is required');
  }
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) throw ApiError.badRequest('Please upload a PNG, JPEG or WebP image');

  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > CUSTOMER_MAX_BYTES) {
    throw ApiError.badRequest('Image too large — please use one under 8MB', { code: 'IMAGE_TOO_LARGE' });
  }

  const result = await persistAsset(buffer, {
    kind: 'image',
    folder: 'customer-backgrounds',
    contentType: match[1],
    filename: 'background',
    baseUrl: requestOrigin(req),
  });
  return sendSuccess(res, { url: result.url }, 201);
});
