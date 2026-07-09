// Public Name Plate Studio API for the customer designer. Prices are recomputed
// server-side (INVARIANT 2); the client quote is a live estimate.

import { api } from './api';

export function getNpCategories() {
  return api.get('/nameplate/categories').then((r) => r.data.data);
}
export function getNpTemplates(params = {}) {
  return api.get('/nameplate/templates', { params }).then((r) => r.data.data);
}
export function getNpTemplate(slug) {
  return api.get(`/nameplate/templates/${slug}`).then((r) => r.data.data);
}
export function quoteNpDesign(slug, design) {
  return api.post(`/nameplate/templates/${slug}/quote`, { design }).then((r) => r.data.data);
}
