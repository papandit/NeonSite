// Public catalog API client (no auth required for reads).

import { api } from './api';

export function getCategories() {
  return api.get('/categories').then((r) => r.data.data);
}

/**
 * @param {object} params { category, subcategory, q, sort, page, limit }
 * @returns {Promise<{ items: any[], meta: object }>}
 */
export function getProducts(params = {}) {
  return api.get('/products', { params }).then((r) => ({
    items: r.data.data,
    meta: r.data.meta,
  }));
}

export function getProductBySlug(slug) {
  return api.get(`/products/${slug}`).then((r) => r.data.data);
}

export function getRelatedProducts(slug) {
  return api.get(`/products/${slug}/related`).then((r) => r.data.data);
}
