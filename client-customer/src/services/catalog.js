// Public catalog API client (no auth required for reads).

import { api } from './api';

export function getCategories() {
  return api.get('/categories').then((r) => r.data.data);
}

// Public store settings + all editable storefront content (admin-managed).
export function getSiteSettings() {
  return api.get('/settings').then((r) => r.data.data);
}

export function getBanners(placement = 'home_hero') {
  return api.get('/banners', { params: { placement } }).then((r) => r.data.data);
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

// "More products for you" — top-rated recommendations (optionally excluding one).
export function getRecommendedProducts({ exclude, limit = 8 } = {}) {
  return api
    .get('/products/recommended', { params: { exclude, limit } })
    .then((r) => r.data.data);
}

export function getProductReviews(slug) {
  return api.get(`/products/${slug}/reviews`).then((r) => r.data.data);
}

export function createReview(payload) {
  return api.post('/reviews', payload).then((r) => r.data.data);
}

// Attachments upload first and come back as { type, url, bytes } descriptors,
// which are then posted with the review. Content-Type is left undefined so the
// browser sets the multipart boundary itself.
export function uploadReviewMedia(files) {
  const form = new FormData();
  [...files].forEach((f) => form.append('files', f));
  return api
    .post('/reviews/media', form, { headers: { 'Content-Type': undefined } })
    .then((r) => r.data.data);
}
