import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

const { Schema, model } = mongoose;

const SubCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, index: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    banner: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

// Slug is unique per parent category (not globally).
SubCategorySchema.index({ category: 1, slug: 1 }, { unique: true });

SubCategorySchema.pre('validate', function autoSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

const SubCategory = model('SubCategory', SubCategorySchema);
export default SubCategory;
