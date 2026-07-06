// GET /api/settings (public) — the storefront's single source of truth for all
// non-catalog content: store identity, contact, socials, the free-shipping
// threshold, and every editable copy block (hero, features, FAQs, info pages…).
// Only safe, public-facing fields are exposed — never GST/HSN/GSTIN internals.

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { getSettings } from '../../models/Settings.js';
import { mergeSiteContent } from '../../config/siteContentDefaults.js';

export const getPublicSettings = asyncHandler(async (req, res) => {
  const s = await getSettings();
  return sendSuccess(res, {
    storeName: s.storeName,
    logoUrl: s.logoUrl,
    supportEmail: s.supportEmail,
    supportPhone: s.supportPhone,
    storeAddress: s.storeAddress,
    socials: s.socials || {},
    freeShippingAbovePaise: s.shipping?.freeAbovePaise ?? null,
    content: mergeSiteContent(s.content),
  });
});
