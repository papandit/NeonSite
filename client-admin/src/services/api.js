// Axios instance for the admin panel. Separate storage keys from the customer
// app so the two never collide. Attaches the JWT; handles 401 via a handler
// the store registers.

import axios from 'axios';

export const TOKEN_KEY = 'nc_admin_token';
export const USER_KEY = 'nc_admin_user';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error?.message || error?.message || fallback;
}
