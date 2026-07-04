import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

const { Schema, model } = mongoose;

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true, lowercase: true, trim: true },
    banner: { type: String, default: '' }, // Cloudinary URL
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

// Auto-fill slug from name when missing/blank.
CategorySchema.pre('validate', function autoSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

const Category = model('Category', CategorySchema);
export default Category;
