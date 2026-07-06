// GET/PUT /api/admin/settings — the store settings singleton. GST feeds the
// checkout tax line; shipping feeds the shipping rule; `content` drives all the
// editable storefront copy. Saving broadcasts an SSE 'settings:changed' event so
// open storefronts refresh their content live.

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { getSettings } from '../../models/Settings.js';
import { mergeSiteContent } from '../../config/siteContentDefaults.js';
import { broadcast } from '../../services/events/bus.js';

const EDITABLE = [
  'storeName', 'logoUrl', 'supportEmail', 'supportPhone', 'socials',
  'gstRatePercent', 'invoicePrefix', 'storeAddress',
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
  // Storefront content — merged over defaults so a partial payload is safe, and
  // marked modified because Mixed paths need an explicit signal to persist.
  if (body.content && typeof body.content === 'object') {
    settings.content = mergeSiteContent({ ...(settings.content || {}), ...body.content });
    settings.markModified('content');
  }

  await settings.save(); // runs validators (money guard on *Paise)
  broadcast('settings:changed', { at: settings.updatedAt });
  return sendSuccess(res, settings);
});
