// Admin operations API: dashboard, orders (with status + render download), settings.

import { api } from './api';

export const getDashboard = () => api.get('/admin/dashboard').then((r) => r.data.data);

export const adminOrders = {
  list: (params) => api.get('/admin/orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data.data),
  updateStatus: (id, body) =>
    api.patch(`/admin/orders/${id}/status`, body).then((r) => r.data.data),
};

// Fetch the production render with auth, then trigger a browser download.
export async function downloadRender(orderId, itemId, filename) {
  const res = await api.get(`/admin/orders/${orderId}/production-render/${itemId}`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const settingsApi = {
  get: () => api.get('/admin/settings').then((r) => r.data.data),
  update: (body) => api.put('/admin/settings', body).then((r) => r.data.data),
};
