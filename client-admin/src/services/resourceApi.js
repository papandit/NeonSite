// Generic CRUD client for any /api/admin/<key> resource. Mirrors the server's
// crudRouter shape so every admin page reuses the same calls.

import { api } from './api';

export function resource(key) {
  const base = `/admin/${key}`;
  return {
    // Returns the full envelope { data, meta } so pages can read pagination.
    list: (params) => api.get(base, { params }).then((r) => r.data),
    get: (id) => api.get(`${base}/${id}`).then((r) => r.data.data),
    create: (body) => api.post(base, body).then((r) => r.data.data),
    update: (id, body) => api.patch(`${base}/${id}`, body).then((r) => r.data.data),
    remove: (id) => api.delete(`${base}/${id}`).then((r) => r.data.data),
    toggle: (id) => api.patch(`${base}/${id}/toggle`).then((r) => r.data.data),
  };
}

export default resource;
