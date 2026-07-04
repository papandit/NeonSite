// Global error-handling middleware. Converts any thrown/forwarded error into
// the standard { success, data, error } envelope. Must be registered LAST.

import config from '../config/index.js';
import ApiError from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
export default function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Internal server error';
  let code;
  let details;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err?.name === 'ValidationError') {
    // Mongoose validation (e.g. the integer-paise guard firing).
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = Object.fromEntries(
      Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
    );
  } else if (err?.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    code = 'CAST_ERROR';
  } else if (err?.code === 11000) {
    // Mongo duplicate key.
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
    code = 'DUPLICATE_KEY';
    details = err.keyValue;
  } else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
    code = 'INVALID_TOKEN';
  } else if (err instanceof Error && err.message) {
    message = err.message;
  }

  // Log server-side. Unexpected (non-operational) errors get a full stack.
  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  } else if (config.isDev) {
    console.warn(`[warn] ${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  const payload = { message, code, details };
  if (config.isDev && statusCode >= 500) {
    payload.stack = err?.stack;
  }

  return sendError(res, payload, statusCode);
}
