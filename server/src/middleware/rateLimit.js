// Rate limiters for abuse-prone endpoints (auth, pricing quote, coupon apply).
// Responses use our standard { success, data, error } envelope. Limits are
// generous enough for real use (the editor debounces quotes) but stop bursts.

import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

const handler = (req, res) =>
  sendError(res, { message: 'Too many requests — please slow down', code: 'RATE_LIMITED' }, 429);

const base = { standardHeaders: true, legacyHeaders: false, handler };

export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 100 });
export const quoteLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 300 });
export const couponLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 60 });

// A customer may review the same product more than once, so the schema no
// longer blocks repeats — this is what stops someone flooding a product with
// ratings. Keyed by account rather than IP: reviewing requires a login, and an
// IP key would punish everyone behind a shared connection.
export const reviewLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) =>
    sendError(res, { message: 'You have posted a lot of reviews recently — try again later', code: 'RATE_LIMITED' }, 429),
});

// Uploads are far heavier than the review row itself, so they get their own,
// tighter budget.
export const reviewMediaLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) =>
    sendError(res, { message: 'Too many uploads — please try again later', code: 'RATE_LIMITED' }, 429),
});
