// GET/PUT /api/admin/neon — the Neon Studio catalogue. The admin can add,
// edit, reorder and delete fonts/colours/sizes/backings/scenes here. Saving
// runs the money guard (paise on sizes/backings) and broadcasts SSE
// 'neon:changed' so an open Neon page refreshes live.

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import ApiError from '../../utils/ApiError.js';
import NeonConfig, { getNeonConfig } from '../../models/NeonConfig.js';
import { broadcast } from '../../services/events/bus.js';

const ARRAYS = ['fonts', 'colors', 'sizes', 'backings', 'scenes'];

export const getNeonConfigAdmin = asyncHandler(async (req, res) => {
  const config = await getNeonConfig();
  return sendSuccess(res, config);
});

export const updateNeonConfig = asyncHandler(async (req, res) => {
  const config = await getNeonConfig();
  const body = req.body || {};

  if (body.maxChars !== undefined) config.maxChars = body.maxChars;
  for (const key of ARRAYS) {
    if (Array.isArray(body[key])) config[key] = body[key];
  }

  try {
    await config.save(); // validators: required keys + money guard on paise
  } catch (err) {
    if (err?.name === 'ValidationError') {
      throw ApiError.badRequest('Neon config is invalid', {
        code: 'NEON_CONFIG_INVALID',
        details: Object.values(err.errors).map((e) => e.message),
      });
    }
    throw err;
  }

  broadcast('neon:changed', { at: config.updatedAt });
  return sendSuccess(res, config);
});

export default { getNeonConfigAdmin, updateNeonConfig };
