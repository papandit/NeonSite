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
