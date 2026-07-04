// Factory for the shared "option" collections (Material, Size, Color, Font,
// Border, Background, MountType, Icon). They all share one shape:
//   { name, slug, priceDeltaPaise (int), status, meta (Mixed) }
// meta differs per collection (hex for Color, widthMm/heightMm for Size, ...).

import mongoose from 'mongoose';
import slugify from '../../utils/slugify.js';
import { paiseField, moneyGuardPlugin } from '../plugins/moneyGuard.js';

const { Schema, model } = mongoose;

/**
 * @param {string} modelName e.g. 'Material'
 * @returns {import('mongoose').Model}
 */
export function buildOptionModel(modelName) {
  const OptionSchema = new Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 160 },
      slug: { type: String, lowercase: true, trim: true },
      priceDeltaPaise: paiseField({ default: 0 }),
      status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true,
      },
      meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
  );

  // Slug unique within each collection.
  OptionSchema.index({ slug: 1 }, { unique: true });

  OptionSchema.pre('validate', function autoSlug(next) {
    if (!this.slug && this.name) this.slug = slugify(this.name);
    next();
  });

  // Safety net for any *Paise field.
  OptionSchema.plugin(moneyGuardPlugin);

  // Avoid OverwriteModelError if a model is built twice (e.g. during tests).
  return mongoose.models[modelName] || model(modelName, OptionSchema);
}

export default buildOptionModel;
