// Rate limiters for abuse-prone endpoints (auth, pricing quote, coupon apply).
// Responses use our standard { success, data, error } envelope. Limits are
// generous enough for real use (the editor debounces quotes) but stop bursts.

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

const handler = (req, res) =>
  sendError(res, { message: 'Too many requests — please slow down', code: 'RATE_LIMITED' }, 429);

const base = { standardHeaders: true, legacyHeaders: false, handler };

// Registration and other auth traffic. Generous — a real person retrying a
// form should never see this.
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 60 });

// Login is the one endpoint worth brute-forcing, so it gets its own, much
// tighter budget. Keyed by IP only: keying by email would let an attacker lock
// a specific customer out of their own account by failing logins for them.
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 12,
  skipSuccessfulRequests: true, // only failures count toward the budget
  handler: (req, res) =>
    sendError(res, { message: 'Too many sign-in attempts — please wait a few minutes', code: 'RATE_LIMITED' }, 429),
});
export const quoteLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 300 });
export const couponLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 60 });

// ipKeyGenerator collapses an IPv6 client to its /64 prefix. Keying on raw
// req.ip would give one attacker a fresh bucket per address — and an IPv6 host
// typically holds 2^64 of them, which is the same as no limit at all.
//
// A customer may review the same product more than once, so the schema no
// longer blocks repeats — this is what stops someone flooding a product with
// ratings. Keyed by account rather than IP: reviewing requires a login, and an
// IP key would punish everyone behind a shared connection.
export const reviewLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
  handler: (req, res) =>
    sendError(res, { message: 'You have posted a lot of reviews recently — try again later', code: 'RATE_LIMITED' }, 429),
});

// Uploads are far heavier than the review row itself, so they get their own,
// tighter budget.
export const reviewMediaLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
  handler: (req, res) =>
    sendError(res, { message: 'Too many uploads — please try again later', code: 'RATE_LIMITED' }, 429),
});
