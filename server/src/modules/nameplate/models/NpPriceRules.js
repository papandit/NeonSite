// Global pricing rules for the Name Plate Studio (singleton). All money is
// integer paise. quoteDesign reads this to compute the final price server-side.

import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from '../../../models/plugins/moneyGuard.js';

const { Schema, model } = mongoose;

const NpPriceRulesSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    // Charged per character beyond `freeCharacters` across all text fields.
    extraCharPricePaise: paiseField({ default: 0 }),
    freeCharacters: { type: Number, default: 0 },
    // Flat surcharges added when a "premium" option (priceDelta > 0) is chosen.
    premiumFontPricePaise: paiseField({ default: 0 }),
    premiumColorPricePaise: paiseField({ default: 0 }),
    premiumElementPricePaise: paiseField({ default: 0 }),
    // Whether option priceDeltas themselves are added (usually yes).
    applyOptionDeltas: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

NpPriceRulesSchema.plugin(moneyGuardPlugin);

const NpPriceRules = model('NpPriceRules', NpPriceRulesSchema);

export async function getNpPriceRules() {
  let doc = await NpPriceRules.findOne({ key: 'global' });
  if (!doc) doc = await NpPriceRules.create({ key: 'global' });
  return doc;
}

export default NpPriceRules;
