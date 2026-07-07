// One place that persists an uploaded file and returns a public URL. Prefers
// Cloudinary when configured (CDN-backed); otherwise stores the bytes in
// MongoDB (Asset collection) and returns a /api/assets/:id URL. Either way the
// upload is fully server-side — no client secret, no unsigned client upload.

import Asset from '../../models/Asset.js';
import { isCloudinaryConfigured, uploadBuffer } from '../cloudinary/index.js';

/**
 * @param {Buffer} buffer
 * @param {object} opts
 * @param {'image'|'font'|'svg'} opts.kind
 * @param {string} [opts.folder]        logical folder (e.g. 'products', 'neon-scenes')
 * @param {string} opts.contentType     MIME type for serving
 * @param {string} [opts.filename]
 * @param {string} [opts.baseUrl]       absolute origin for building the DB url
 * @returns {Promise<{ url:string, bytes:number, format?:string, id?:string, storage:'cloudinary'|'mongodb' }>}
 */
export async function persistAsset(buffer, { kind = 'image', folder = '', contentType = 'application/octet-stream', filename = '', baseUrl = '' } = {}) {
  if (isCloudinaryConfigured()) {
    const resourceType = kind === 'font' ? 'raw' : 'image';
    const result = await uploadBuffer(buffer, { folder: `namecraft/${folder || kind}`, resourceType });
    return { url: result.url, bytes: result.bytes, format: result.format, storage: 'cloudinary' };
  }

  const doc = await Asset.create({
    data: buffer,
    contentType,
    filename,
    kind,
    folder,
    bytes: buffer.length,
  });
  return {
    url: `${baseUrl}/api/assets/${doc._id}`,
    id: String(doc._id),
    bytes: buffer.length,
    storage: 'mongodb',
  };
}

/** Absolute origin of the current request, for building asset URLs. */
export function requestOrigin(req) {
  return `${req.protocol}://${req.get('host')}`;
}
