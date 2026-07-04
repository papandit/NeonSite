// Cart, coupon, checkout, payments, and orders API clients (all auth).

import { api } from './api';

// --- Cart ---
export const cartApi = {
  get: () => api.get('/cart').then((r) => r.data.data),
  add: (productId, designDocument, quantity = 1) =>
    api.post('/cart', { productId, designDocument, quantity }).then((r) => r.data.data),
  update: (itemId, patch) => api.patch(`/cart/${itemId}`, patch).then((r) => r.data.data),
  remove: (itemId) => api.delete(`/cart/${itemId}`).then((r) => r.data.data),
  clear: () => api.delete('/cart').then((r) => r.data.data),
};

// --- Coupon ---
export const applyCoupon = (code) =>
  api.post('/coupons/apply', { code }).then((r) => r.data.data);

// --- Checkout ---
export const checkoutQuote = (couponCode) =>
  api.post('/checkout/quote', { couponCode }).then((r) => r.data.data);

// --- Payments ---
export const createPaymentOrder = (couponCode) =>
  api.post('/payments/razorpay/order', { couponCode }).then((r) => r.data.data);

export const verifyPayment = (payload) =>
  api.post('/payments/razorpay/verify', payload).then((r) => r.data.data);

// --- Orders ---
export const ordersApi = {
  list: () => api.get('/orders').then((r) => r.data.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data.data),
};
