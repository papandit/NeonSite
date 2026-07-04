// GET/PUT /api/admin/settings — the store settings singleton (GST feeds the
// checkout tax line; shipping feeds the shipping rule).

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { getSettings } from '../../models/Settings.js';

const EDITABLE = [
  'storeName', 'logoUrl', 'supportEmail', 'supportPhone', 'socials',
  'gstRatePercent', 'invoicePrefix',
];

export const getStoreSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  return sendSuccess(res, settings);
});

export const updateStoreSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const body = req.body || {};

  for (const key of EDITABLE) {
    if (body[key] !== undefined) settings[key] = body[key];
  }
  if (body.shipping && typeof body.shipping === 'object') {
    if (body.shipping.flatPaise !== undefined) settings.shipping.flatPaise = body.shipping.flatPaise;
    if (body.shipping.freeAbovePaise !== undefined) settings.shipping.freeAbovePaise = body.shipping.freeAbovePaise;
  }

  await settings.save(); // runs validators (money guard on *Paise)
  return sendSuccess(res, settings);
});
