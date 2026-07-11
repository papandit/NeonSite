// Generic CRUD client for any /api/admin/<key> resource. Mirrors the server's
// crudRouter shape so every admin page reuses the same calls.
//
// Mutations (create/update/remove/toggle) fire a toast on success/failure, so
// EVERY generic CRUD page (products, categories, coupons, banners, options, all
// nameplate collections) gets consistent feedback without per-page wiring.

import { api, apiErrorMessage } from './api';
import { toast } from '../lib/toast';

// Run a mutation, toasting the outcome. Re-throws so callers keep their own
// error handling (inline banners, busy flags) intact.
async function withToast(promise, successMsg) {
  try {
    const result = await promise;
    if (successMsg) toast.success(successMsg);
    return result;
  } catch (err) {
    toast.error(apiErrorMessage(err));
    throw err;
  }
}

export function resource(key) {
  const base = `/admin/${key}`;
  return {
    // Reads — no toast.
    // Returns the full envelope { data, meta } so pages can read pagination.
    list: (params) => api.get(base, { params }).then((r) => r.data),
    get: (id) => api.get(`${base}/${id}`).then((r) => r.data.data),
    // Mutations — toast on success/failure.
    create: (body) => withToast(api.post(base, body).then((r) => r.data.data), 'Created'),
    update: (id, body) => withToast(api.patch(`${base}/${id}`, body).then((r) => r.data.data), 'Saved changes'),
    remove: (id) => withToast(api.delete(`${base}/${id}`).then((r) => r.data.data), 'Deleted'),
    toggle: (id) => withToast(api.patch(`${base}/${id}/toggle`).then((r) => r.data.data), 'Updated'),
  };
}

export default resource;
