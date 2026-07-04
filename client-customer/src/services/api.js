// Axios instance for the customer storefront. Attaches the JWT to every
// request and handles 401 by triggering a logout (registered from the store).

import axios from 'axios';

export const TOKEN_KEY = 'nc_customer_token';
export const USER_KEY = 'nc_customer_user';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
