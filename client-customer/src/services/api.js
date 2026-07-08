// Axios instance for the customer storefront. Attaches the JWT to every
// request and handles 401 by triggering a logout (registered from the store).

import axios from 'axios';

export const TOKEN_KEY = 'nc_customer_token';
export const USER_KEY = 'nc_customer_user';

// In production default to a SAME-ORIGIN '/api' (served via reverse proxy) so
// the deployed app never calls the visitor's localhost. Override with
// VITE_API_BASE_URL at build time for a separate API host.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
const baseURL = API_BASE_URL;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// The store registers a handler so a 401 clears auth state + redirects.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

// Attach the token from localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

// Normalize an axios error to a display message from our { error: { message } } shape.
export function apiErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
}
