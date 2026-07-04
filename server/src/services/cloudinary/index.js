// Server-signed Cloudinary uploads (INVARIANT 7). The secret never leaves the
// server. Uploads stream a buffer (from multer memory storage) to Cloudinary.

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import config, { requireFeatureEnv } from '../../config/index.js';

let configured = false;

function ensureConfigured() {
  requireFeatureEnv('Cloudinary', [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ]);
  if (!configured) {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });
    configured = true;
  }
}

/** True if Cloudinary credentials are present (for a graceful UI hint). */
export function isCloudinaryConfigured() {
  return Boolean(
    config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
  );
}

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {object} opts
 * @param {string} opts.folder Cloudinary folder, e.g. 'namecraft/banners'
 * @param {'image'|'raw'|'auto'} [opts.resourceType='image']
 * @param {string} [opts.publicId]
 * @returns {Promise<{ url: string, publicId: string, bytes: number, format: string }>}
 */
export function uploadBuffer(buffer, { folder, resourceType = 'image', publicId } = {}) {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, public_id: publicId, overwrite: true },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export default { uploadBuffer, isCloudinaryConfigured };
