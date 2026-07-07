import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';
import { paiseField, moneyGuardPlugin } from './plugins/moneyGuard.js';

const { Schema, model } = mongoose;

// A customization panel: on/off, the allowed option ids, and whether required.
const panel = (ref) => ({
  enabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  options: [{ type: Schema.Types.ObjectId, ref }],
});

const TextFieldSchema = new Schema(
  {
    key: { type: String, required: true, trim: true }, // e.g. "familyName"
    label: { type: String, required: true, trim: true }, // e.g. "Family Name"
    required: { type: Boolean, default: false },
    maxLength: { type: Number, default: 40, min: 1 },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, index: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    subCategory: { type: Schema.Types.ObjectId, ref: 'SubCategory' },
    description: { type: String, default: '' },
    images: [{ type: String }], // Cloudinary URLs
    basePricePaise: paiseField({ required: true }),
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ['active', 'hidden'], default: 'active', index: true },
    // 'neon' products are priced by the Neon Studio (quoteNeon), not the option
    // engine; used to route cart/checkout repricing. Regular plates are 'plate'.
    kind: { type: String, enum: ['plate', 'neon'], default: 'plate', index: true },

    // Product Builder output — drives the storefront editor (Phase 3).
    customizationConfig: {
      material: panel('Material'),
      size: panel('Size'),
      font: panel('Font'),
      color: panel('Color'),
      background: panel('Background'),
      border: panel('Border'),
      mountType: panel('MountType'),
      icons: {
        enabled: { type: Boolean, default: false },
        required: { type: Boolean, default: false },
        options: [{ type: Schema.Types.ObjectId, ref: 'Icon' }],
        max: { type: Number, default: 3, min: 0 },
      },
      textFields: { type: [TextFieldSchema], default: [] },
    },
  },
  { timestamps: true }
);

ProductSchema.plugin(moneyGuardPlugin);

ProductSchema.pre('validate', function autoSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

const Product = model('Product', ProductSchema);
export default Product;
