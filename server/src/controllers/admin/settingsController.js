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

// Password-like fields: never echoed back, and preserved when the admin submits
// a blank (so re-saving the form doesn't wipe a stored secret).
const SECRETS = [['razorpay', 'keySecret'], ['smtp', 'pass'], ['gemini', 'apiKey'], ['googleFonts', 'apiKey']];

// Return a plain settings object with secrets masked + a `secretsSet` map so the
// UI can show "saved" without leaking the values.
function maskedSettings(settings) {
  const obj = settings.toObject();
  obj.integrations = obj.integrations || {};
  const secretsSet = {};
  for (const [grp, key] of SECRETS) {
    secretsSet[`${grp}.${key}`] = Boolean(obj.integrations[grp]?.[key]);
    if (obj.integrations[grp]) obj.integrations[grp][key] = '';
  }
  obj.secretsSet = secretsSet;
  return obj;
}

export const getStoreSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  return sendSuccess(res, maskedSettings(settings));
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
  if (body.content && typeof body.content === 'object') {
    settings.content = mergeSiteContent({ ...(settings.content || {}), ...body.content });
    settings.markModified('content');
  }

  // Integrations (Razorpay / SMTP / Gemini / Google Fonts). Secrets left blank
  // keep their stored value; everything else is set as given.
  if (body.integrations && typeof body.integrations === 'object') {
    if (!settings.integrations) settings.integrations = {};
    const secretKeys = new Set(SECRETS.map(([, k]) => k));
    const applyGroup = (grp, keys) => {
      const src = body.integrations[grp];
      if (!src || typeof src !== 'object') return;
      if (!settings.integrations[grp]) settings.integrations[grp] = {};
      for (const k of keys) {
        let v = src[k];
        if (v === undefined) continue;
        if (secretKeys.has(k) && typeof v === 'string' && v.trim() === '') continue; // preserve
        if (k === 'port') v = Number(v) || 587;
        settings.integrations[grp][k] = v;
      }
    };
    applyGroup('razorpay', ['keyId', 'keySecret']);
    applyGroup('smtp', ['host', 'port', 'user', 'pass', 'from']);
    applyGroup('gemini', ['apiKey', 'model', 'prompt']);
    applyGroup('googleFonts', ['apiKey']);
    settings.markModified('integrations');
  }

  await settings.save(); // runs validators (money guard on *Paise)
  broadcast('settings:changed', { at: settings.updatedAt });
  return sendSuccess(res, maskedSettings(settings));
});
