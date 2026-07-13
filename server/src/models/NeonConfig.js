// Neon Sign Studio catalogue singleton — the admin-managed set of fonts,
// colours, sizes (with paise pricing), backings and preview scenes. quoteNeon
// prices from this doc so the neon price is ALWAYS server-authoritative
// (INVARIANT 2). Money fields are integer paise (INVARIANT 1).

import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from './plugins/moneyGuard.js';
import { DEFAULT_NEON } from '../config/neonDefaults.js';

const { Schema, model } = mongoose;

const FontSchema = new Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  cssFamily: { type: String, required: true, trim: true },
  script: { type: Boolean, default: false }, // script fonts use more tube
  active: { type: Boolean, default: true },
}, { _id: false });

const ColorSchema = new Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  fill: { type: String, required: true, trim: true }, // inner tube colour
  glow: { type: String, required: true, trim: true }, // outer glow colour
  active: { type: Boolean, default: true },
}, { _id: false });

const SizeSchema = new Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  cm: { type: Number, required: true, min: 1 },
  basePricePaise: paiseField({ required: true }),
  perCharPaise: paiseField({ default: 0 }),
  fontSizePx: { type: Number, default: 46, min: 8 },
  // Physical sign dimensions. heightCm = height of one line at this size (0 =
  // derive from fontSizePx). perCharCm = width added per character (0 = auto,
  // from the actual rendered text). Both drive the storefront dimension guides.
  heightCm: { type: Number, default: 0, min: 0 },
  perCharCm: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
}, { _id: false });

const BackingSchema = new Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  priceDeltaPaise: paiseField({ default: 0 }),
  active: { type: Boolean, default: true },
}, { _id: false });

const AdapterSchema = new Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  priceDeltaPaise: paiseField({ default: 0 }),
  active: { type: Boolean, default: true },
}, { _id: false });

const SceneSchema = new Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' }, // admin-uploaded backdrop (optional)
  active: { type: Boolean, default: true },
}, { _id: false });

const NeonConfigSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    maxChars: { type: Number, default: 40, min: 1, max: 200 },
    fonts: { type: [FontSchema], default: () => DEFAULT_NEON.fonts },
    colors: { type: [ColorSchema], default: () => DEFAULT_NEON.colors },
    sizes: { type: [SizeSchema], default: () => DEFAULT_NEON.sizes },
    backings: { type: [BackingSchema], default: () => DEFAULT_NEON.backings },
    adapters: { type: [AdapterSchema], default: () => DEFAULT_NEON.adapters },
    scenes: { type: [SceneSchema], default: () => DEFAULT_NEON.scenes },
  },
  { timestamps: true }
);

NeonConfigSchema.plugin(moneyGuardPlugin);

const NeonConfig = model('NeonConfig', NeonConfigSchema);

/** Get the neon config singleton, seeding defaults on first call. */
export async function getNeonConfig() {
  let doc = await NeonConfig.findOne({ key: 'global' });
  if (!doc) doc = await NeonConfig.create({ key: 'global' });
  return doc;
}

export default NeonConfig;
