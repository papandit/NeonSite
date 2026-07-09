// GET/PUT the Name Plate Studio price-rules singleton.

import asyncHandler from '../../../utils/asyncHandler.js';
import { sendSuccess } from '../../../utils/apiResponse.js';
import { getNpPriceRules } from '../models/NpPriceRules.js';
import { broadcast } from '../../../services/events/bus.js';

const EDITABLE = [
  'extraCharPricePaise', 'freeCharacters', 'premiumFontPricePaise',
  'premiumColorPricePaise', 'premiumElementPricePaise', 'applyOptionDeltas', 'currency',
];

export const getPriceRules = asyncHandler(async (req, res) => {
  return sendSuccess(res, await getNpPriceRules());
});

export const updatePriceRules = asyncHandler(async (req, res) => {
  const rules = await getNpPriceRules();
  for (const key of EDITABLE) {
    if (req.body?.[key] !== undefined) rules[key] = req.body[key];
  }
  await rules.save();
  broadcast('nameplate:changed', { at: rules.updatedAt });
  return sendSuccess(res, rules);
});
