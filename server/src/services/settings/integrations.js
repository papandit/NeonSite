// Resolved integration config: admin-saved Settings.integrations OVERRIDE the
// server .env, so keys/SMTP/Gemini/Fonts can be updated live from the admin
// without a redeploy. A blank saved value falls back to the env default.

import config from '../../config/index.js';
import { getSettings } from '../../models/Settings.js';

const pick = (a, b) => (a !== undefined && a !== null && String(a).trim() !== '' ? a : b);

export async function getIntegrations() {
  const s = await getSettings();
  const i = s.integrations || {};
  return {
    razorpay: {
      keyId: pick(i.razorpay?.keyId, config.razorpay.keyId) || '',
      keySecret: pick(i.razorpay?.keySecret, config.razorpay.keySecret) || '',
    },
    smtp: {
      host: pick(i.smtp?.host, config.smtp.host) || '',
      port: i.smtp?.port || config.smtp.port || 587,
      user: pick(i.smtp?.user, config.smtp.user) || '',
      pass: pick(i.smtp?.pass, config.smtp.pass) || '',
      from: pick(i.smtp?.from, config.smtp.from) || 'NameCraft <no-reply@namecraft.local>',
    },
    gemini: {
      apiKey: pick(i.gemini?.apiKey, config.gemini.apiKey) || '',
      model: pick(i.gemini?.model, config.gemini.model) || 'gemini-1.5-flash',
      prompt: i.gemini?.prompt || '',
    },
    googleFonts: {
      apiKey: pick(i.googleFonts?.apiKey, config.googleFonts.apiKey) || '',
    },
  };
}

export default getIntegrations;
