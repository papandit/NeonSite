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

// A simple, first-class colour option for the plain store product. The buyer
// picks one on the product page; the choice is snapshotted onto the order. Kept
// separate from the customizationConfig option engine (Studios) on purpose.
const ColorSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    hex: { type: String, trim: true, required: true },
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
    // Rich, admin-editable product detail (shown as sections on the product page).
    // Multiline strings — each non-empty line becomes a bullet / row on render.
    highlights: { type: String, default: '' },   // short selling points near the price
    material: { type: String, default: '' },
    dimensions: { type: String, default: '' },
    whatsIncluded: { type: String, default: '' }, // one item per line
    careHandling: { type: String, default: '' },  // one instruction per line
    images: [{ type: String }], // Cloudinary URLs
    colors: { type: [ColorSchema], default: [] }, // buyer-selectable colours

    // ---- Ready-made neon signs (catalogue products, NOT the Neon Studio) ----
    // When `isNeon` is true the storefront shows a light ON/OFF toggle using the
    // two artwork images below, plus the physical size and colour description.
    isNeon: { type: Boolean, default: false, index: true },
    lightOnImageUrl: { type: String, default: '' },   // sign lit up
    lightOffImageUrl: { type: String, default: '' },  // sign switched off
    sizeText: { type: String, default: '' },          // e.g. "10 x 13"
    sizeUnits: { type: String, default: '' },         // e.g. "Inches"
    colorText: { type: String, default: '' },         // e.g. "Red & Skyblue"
    basePricePaise: paiseField({ required: true }),
    // Optional "original" / MRP price shown struck-through when higher than the
    // selling price (basePricePaise). 0 = no compare-at price.
    compareAtPricePaise: paiseField({ default: 0 }),
    rating: { type: Number, default: 0, min: 0, max: 5 },
    // Denormalised from approved reviews (Review.recomputeProductRating) and
    // from paid orders, so "top rated" / "most reviewed" / "best selling" are
    // plain indexed sorts rather than a per-request aggregate.
    numReviews: { type: Number, default: 0, min: 0, index: true },
    soldCount: { type: Number, default: 0, min: 0, index: true },
    status: { type: String, enum: ['active', 'hidden'], default: 'active', index: true },
    // Routes cart/checkout repricing: 'neon' -> Neon Studio, 'nameplate' -> Name
    // Plate Studio (quoteNpDesign), else the option engine. Regular = 'plate'.
    kind: { type: String, enum: ['plate', 'neon', 'nameplate'], default: 'plate', index: true },

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
