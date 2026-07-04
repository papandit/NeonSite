// A typed error for EXPECTED failures (validation, auth, not-found, ...).
// Throw these from controllers/services; the global error handler formats them
// into the standard { success, data, error } envelope with the right status.

export default class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} message human-readable message (safe to show clients)
   * @param {object} [opts]
   * @param {string} [opts.code] machine-readable code, e.g. 'INVALID_CREDENTIALS'
   * @param {*} [opts.details] extra structured info
   */
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, opts) {
    return new ApiError(400, message, opts);
  }
  static unauthorized(message = 'Not authenticated', opts) {
    return new ApiError(401, message, opts);
  }
  static forbidden(message = 'Not authorized', opts) {
    return new ApiError(403, message, opts);
  }
  static notFound(message = 'Resource not found', opts) {
    return new ApiError(404, message, opts);
  }
  static conflict(message, opts) {
    return new ApiError(409, message, opts);
  }
}
