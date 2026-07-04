// Auth controller: register, login, profile. Thin — validation + model calls.

import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import User from '../models/User.js';
import { issueToken } from '../services/auth/token.js';

function assertNonEmpty(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw ApiError.badRequest(`${label} is required`);
  }
}

/**
 * POST /api/auth/register
 * Public self-registration always creates a 'customer'. Admins are created via
 * the seed script / admin tooling only — role is never taken from the client.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  assertNonEmpty(name, 'Name');
  assertNonEmpty(email, 'Email');
  assertNonEmpty(password, 'Password');
  if (password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', {
      code: 'EMAIL_TAKEN',
    });
  }

  const user = new User({ name: name.trim(), email, role: 'customer' });
  await user.setPassword(password);
  await user.save();

  const token = issueToken({ id: user._id.toString(), role: user.role });
  return sendSuccess(res, { token, user: user.toSafeObject() }, 201);
});

/**
 * POST /api/auth/login
 * Returns the JWT + safe user object.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  assertNonEmpty(email, 'Email');
  assertNonEmpty(password, 'Password');

  // passwordHash is select:false — request it explicitly.
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+passwordHash'
  );
  // Same message for unknown email and wrong password (no user enumeration).
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password', {
      code: 'INVALID_CREDENTIALS',
    });
  }

  const token = issueToken({ id: user._id.toString(), role: user.role });
  return sendSuccess(res, { token, user: user.toSafeObject() });
});

/**
 * GET /api/auth/profile  (requireAuth)
 */
export const profile = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user });
});
