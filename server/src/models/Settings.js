// Store settings singleton — GST rate, shipping rule, store info. Read via
// getSettings(); the admin edits it in Phase 5.4.

import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from './plugins/moneyGuard.js';

const { Schema, model } = mongoose;

const SettingsSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    storeName: { type: String, default: 'NameCraft' },
    logoUrl: { type: String, default: '' },
    supportEmail: { type: String, default: 'support@namecraft.local' },
    supportPhone: { type: String, default: '' },
    socials: { type: Schema.Types.Mixed, default: {} },

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
