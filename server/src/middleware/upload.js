// Multer intake (memory storage) with per-asset-type MIME + size validation.
// Buffers are handed to the Cloudinary service; nothing touches disk.

import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const MB = 1024 * 1024;

function fileFilter(allowedMimes, label) {
  return (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest(`Invalid ${label} type: ${file.mimetype}`, {
      code: 'INVALID_FILE_TYPE',
    }));
  };
}

// Images (banners, product images).
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * MB },
  fileFilter: fileFilter(
    ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    'image'
  ),
}).single('file');

// Font files.
export const uploadFont = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * MB },
  fileFilter: fileFilter(
    [
      'font/ttf',
      'font/otf',
      'font/woff',
      'font/woff2',
      'application/font-woff',
      'application/x-font-ttf',
      'application/x-font-otf',
      'application/octet-stream', // some browsers send this for fonts
    ],
    'font'
  ),
}).single('file');

// SVG icons.
export const uploadSvg = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * MB },
  fileFilter: fileFilter(['image/svg+xml', 'text/xml', 'text/plain'], 'SVG'),
}).single('file');

/**
 * Wrap a multer middleware so its errors become ApiErrors in our envelope.
 * @param {import('express').RequestHandler} mw
 */
export function handleUpload(mw) {
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (!err) return next();
      if (err instanceof ApiError) return next(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('File too large', { code: 'FILE_TOO_LARGE' }));
      }
      return next(ApiError.badRequest(err.message || 'Upload failed'));
    });
  };
}
