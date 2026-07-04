// Asset uploads via the server-signed endpoints (INVARIANT 7 — no direct
// client->Cloudinary). Also exposes admin meta (uploadsEnabled + collections).

import { api } from './api';

/**
 * @param {'image'|'font'|'svg'} kind
 * @param {File} file
 * @returns {Promise<{url:string, publicId:string, format?:string}>}
 */
export async function uploadAsset(kind, file, { folder } = {}) {
  const form = new FormData();
  form.append('file', file);
  const url = `/admin/uploads/${kind}${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`;
  // Content-Type undefined -> browser sets multipart boundary automatically.
  const { data } = await api.post(url, form, {
    headers: { 'Content-Type': undefined },
  });
  return data.data;
}

let metaCache = null;
export async function getAdminMeta() {
  if (metaCache) return metaCache;
  const { data } = await api.get('/admin/meta');
  metaCache = data.data;
  return metaCache;
}
