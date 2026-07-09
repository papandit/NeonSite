// GET /api/fonts — the full Google Fonts family list, served to the admin font
// browser. The API key stays server-side (config.googleFonts.apiKey); the
// result is cached in memory for a day. If no key is configured, returns an
// empty list so the client falls back to its bundled catalogue.

import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import config from '../../config/index.js';

let cache = { at: 0, families: [] };
const TTL_MS = 24 * 60 * 60 * 1000; // 1 day (in-memory)

export const getFonts = asyncHandler(async (req, res) => {
  const key = config.googleFonts.apiKey;
  if (!key) return sendSuccess(res, { source: 'none', families: [] });

  const fresh = Date.now() - cache.at < TTL_MS && cache.families.length > 0;
  if (!fresh) {
    try {
      const url = `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${encodeURIComponent(key)}`;
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        const families = (data.items || [])
          .map((f) => f.family)
          .filter((f) => !/icons|material symbols/i.test(f)); // drop icon fonts
        cache = { at: Date.now(), families };
      }
    } catch {
      /* keep any stale cache; fall through */
    }
  }

  res.set('Cache-Control', 'public, max-age=86400');
  return sendSuccess(res, { source: cache.families.length ? 'google' : 'none', families: cache.families });
});
