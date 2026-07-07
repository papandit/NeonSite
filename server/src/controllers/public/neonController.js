// Public Neon Studio endpoints:
//   GET  /api/neon/config  — active fonts/colours/sizes/backings/scenes (+ paise
//        pricing so the client can show a live estimate as you type).
//   POST /api/neon/quote   — the SERVER-authoritative price for a spec (display).
// The price charged is recomputed again at cart-add and checkout (INVARIANT 2).

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { getNeonConfig } from '../../models/NeonConfig.js';
import { quoteNeon } from '../../services/neon/quoteNeon.js';

const activeOnly = (list, fields) =>
  (list || [])
    .filter((x) => x.active !== false)
    .map((x) => Object.fromEntries(fields.map((f) => [f, x[f]])));

export const getNeonConfigPublic = asyncHandler(async (req, res) => {
  const c = await getNeonConfig();
  return sendSuccess(res, {
    maxChars: c.maxChars,
    fonts: activeOnly(c.fonts, ['key', 'name', 'cssFamily', 'script']),
    colors: activeOnly(c.colors, ['key', 'name', 'fill', 'glow']),
    sizes: activeOnly(c.sizes, ['key', 'name', 'cm', 'basePricePaise', 'perCharPaise', 'fontSizePx']),
    backings: activeOnly(c.backings, ['key', 'name', 'priceDeltaPaise']),
    scenes: activeOnly(c.scenes, ['key', 'name']),
  });
});

export const quoteNeonPublic = asyncHandler(async (req, res) => {
  const c = await getNeonConfig();
  const { errors, designDocument } = quoteNeon(c, req.body?.spec || req.body || {});
  return sendSuccess(res, { errors, designDocument });
});
