// Auth middleware: requireAuth populates req.user from the Bearer token;
// requireRole guards routes by role.

import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../services/auth/token.js';
import User from '../models/User.js';

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

/**
 * Require a valid JWT. On success sets:
 *   req.user = { id, name, email, role }
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearer(req);
  if (!token) {
    throw ApiError.unauthorized('Authentication required', { code: 'NO_TOKEN' });
  }

  const payload = verifyToken(token); // throws -> 401 via error handler
  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists', { code: 'USER_NOT_FOUND' });
  }

  req.user = user.toSafeObject();
  req.userDoc = user;
  next();
});

/**
 * Populate req.user when a valid token is present, but never reject. For public
 * endpoints that show a little more to a signed-in visitor — e.g. marking which
 * reviews are their own so they can delete them — without making the whole
 * response require a login. A bad or expired token is treated as anonymous
 * rather than an error, so a stale token can't break a public page.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearer(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user) {
      req.user = user.toSafeObject();
      req.userDoc = user;
    }
  } catch {
    // anonymous
  }
  next();
});

/**
 * Require the authenticated user to have one of the given roles.
 * Use AFTER requireAuth: router.use(requireAuth, requireRole('admin')).
 * @param {...string} roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to access this resource', {
          code: 'INSUFFICIENT_ROLE',
        })
      );
    }
    next();
  };
}
