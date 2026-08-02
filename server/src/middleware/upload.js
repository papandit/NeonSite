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

// Review attachments — customer-supplied, so the caps are tighter than the
// admin ones and the count is bounded too. Videos get more headroom than
// photos but stay small enough to live in a Mongo document; anything longer
// than a short clip belongs on a video host, not in our database.
export const REVIEW_MEDIA_MAX = 4;
export const REVIEW_IMAGE_BYTES = 5 * MB;
export const REVIEW_VIDEO_BYTES = 15 * MB;

const REVIEW_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
const REVIEW_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm'];

export const uploadReviewMedia = multer({
  storage: multer.memoryStorage(),
  // Multer can only enforce one ceiling, so it guards the larger of the two;
  // the per-type limit is checked in the controller once the MIME is known.
  limits: { fileSize: REVIEW_VIDEO_BYTES, files: REVIEW_MEDIA_MAX },
  fileFilter: fileFilter([...REVIEW_IMAGE_MIMES, ...REVIEW_VIDEO_MIMES], 'attachment'),
}).array('files', REVIEW_MEDIA_MAX);

/** Per-type size ceiling for a review attachment, by MIME. */
export function reviewMediaLimit(mimetype) {
  if (REVIEW_VIDEO_MIMES.includes(mimetype)) return { kind: 'video', max: REVIEW_VIDEO_BYTES };
  if (REVIEW_IMAGE_MIMES.includes(mimetype)) return { kind: 'image', max: REVIEW_IMAGE_BYTES };
  return null;
}

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
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(ApiError.badRequest(`Too many files — up to ${REVIEW_MEDIA_MAX} allowed`, { code: 'TOO_MANY_FILES' }));
      }
      return next(ApiError.badRequest(err.message || 'Upload failed'));
    });
  };
}
