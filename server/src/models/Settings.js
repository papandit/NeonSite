// Store settings singleton — GST rate, shipping rule, store info. Read via
// getSettings(); the admin edits it in Phase 5.4.

import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from './plugins/moneyGuard.js';
import { DEFAULT_SITE_CONTENT } from '../config/siteContentDefaults.js';

const { Schema, model } = mongoose;

const SettingsSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    storeName: { type: String, default: 'OWM NameCraft Ecom' },
    logoUrl: { type: String, default: '' },
    supportEmail: { type: String, default: 'support@namecraft.local' },
    supportPhone: { type: String, default: '' },
    socials: { type: Schema.Types.Mixed, default: {} },

    // All storefront copy the admin can edit (hero, features, FAQs, info pages…).
    // Defaults mirror the built-in customer content; see siteContentDefaults.js.
    content: { type: Schema.Types.Mixed, default: () => ({ ...DEFAULT_SITE_CONTENT }) },

    // Admin-editable integration credentials/config. Override the server .env at
    // runtime (see services/settings/integrations.js). Blank = fall back to env.
    integrations: {
      razorpay: { keyId: { type: String, default: '' }, keySecret: { type: String, default: '' } },
      smtp: {
        host: { type: String, default: '' }, port: { type: Number, default: 587 },
        user: { type: String, default: '' }, pass: { type: String, default: '' }, from: { type: String, default: '' },
      },
      gemini: { apiKey: { type: String, default: '' }, model: { type: String, default: '' }, prompt: { type: String, default: '' } },
      googleFonts: { apiKey: { type: String, default: '' } },
    },

    // GST as a whole/decimal percent (e.g. 18 = 18%). tax = round(taxable * rate/100).
    gstRatePercent: { type: Number, default: 18, min: 0, max: 100 },

    shipping: {
      flatPaise: paiseField({ default: 9900 }), // ₹99 flat
      freeAbovePaise: paiseField({ default: 200000 }), // free over ₹2000
    },

    invoicePrefix: { type: String, default: 'OWM' },

    // Single-HSN store (plan §15). Per-category HSN is a later data change.
    hsnCode: { type: String, default: '8306' }, // decorative base-metal articles
    gstin: { type: String, default: '' },
    storeAddress: { type: String, default: 'Onewebmart, Ahmedabad, Gujarat' },
  },
  { timestamps: true }
);

SettingsSchema.plugin(moneyGuardPlugin);

const Settings = model('Settings', SettingsSchema);

/** Get the settings singleton, creating defaults on first call. */
export async function getSettings() {
  let doc = await Settings.findOne({ key: 'global' });
  if (!doc) doc = await Settings.create({ key: 'global' });
  return doc;
}

export default Settings;
