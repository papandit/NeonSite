// Shared model for every simple Name Plate Studio collection (categories, fonts,
// colours, elements, icons, shapes, materials, sizes, backgrounds). They share
// one shape; collection-specific data (hex, fileUrl, widthMm, svg, image…) lives
// in `meta`. Money is integer paise (INVARIANT 1). This module is fully
// independent of the existing product catalogue.

import mongoose from 'mongoose';
import slugify from '../../../utils/slugify.js';
import { paiseField, moneyGuardPlugin } from '../../../models/plugins/moneyGuard.js';

const { Schema, model } = mongoose;

/**
 * @param {string} modelName e.g. 'NpFont'
 * @returns {import('mongoose').Model}
 */
export function buildNpOptionModel(modelName) {
  const OptionSchema = new Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 200 },
      slug: { type: String, lowercase: true, trim: true },
      description: { type: String, default: '' },
      // Convenience top-level asset fields (also mirrored in meta where relevant).
      imageUrl: { type: String, default: '' },
      svg: { type: String, default: '' },
      priceDeltaPaise: paiseField({ default: 0 }),
      status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
      sortOrder: { type: Number, default: 0 },
      meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
  );

  // Slug unique within each collection; auto-generated with a random suffix so
  // duplicate names never collide.
  OptionSchema.index({ slug: 1 }, { unique: true, sparse: true });
  OptionSchema.pre('validate', function autoSlug(next) {
    if (!this.slug && this.name) {
      // _id is unique, so the slug never collides even for duplicate names.
      this.slug = `${slugify(this.name)}-${String(this._id).slice(-6)}`;
    }
    next();
  });

  OptionSchema.plugin(moneyGuardPlugin);

  return mongoose.models[modelName] || model(modelName, OptionSchema);
}

export default buildNpOptionModel;
