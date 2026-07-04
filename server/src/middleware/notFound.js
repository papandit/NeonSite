// Catches requests that matched no route and forwards a 404 ApiError to the
// global error handler.

import ApiError from '../utils/ApiError.js';

export default function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
