// A Name Plate template — the core of the studio. The admin uploads a base
// plate image and defines the dynamic text fields + canvas layout; the customer
// only ever sees the fields the admin exposed here. Everything is data-driven.

import mongoose from 'mongoose';
import slugify from '../../../utils/slugify.js';
import { paiseField, moneyGuardPlugin } from '../../../models/plugins/moneyGuard.js';

const { Schema, model } = mongoose;

// A dynamic, admin-defined text field the customer fills in.
const TextFieldSchema = new Schema({
  key: { type: String, required: true, trim: true },        // stable id, e.g. 'name'
  label: { type: String, required: true, trim: true },      // display label
  placeholder: { type: String, default: '' },
  defaultValue: { type: String, default: '' },
  required: { type: Boolean, default: false },
  minLength: { type: Number, default: 0 },
  maxLength: { type: Number, default: 40 },
  // Defaults for how the text renders on the plate.
  defaultFont: { type: Schema.Types.ObjectId, ref: 'NpFont', default: null },
  defaultFontFamily: { type: String, default: '' },         // convenience fallback
  defaultSizePx: { type: Number, default: 40 },
  defaultColorHex: { type: String, default: '#1a1a1a' },
  x: { type: Number, default: 0.5 },                        // normalized 0..1
  y: { type: Number, default: 0.5 },
  rotation: { type: Number, default: 0 },
  align: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
  // Per-field customer capabilities.
  canResize: { type: Boolean, default: true },
  canRotate: { type: Boolean, default: false },
  canMove: { type: Boolean, default: true },
  canChangeColor: { type: Boolean, default: true },
  canChangeFont: { type: Boolean, default: true },
  canChangeSize: { type: Boolean, default: true },
  canBold: { type: Boolean, default: true },
  canItalic: { type: Boolean, default: true },
  canOutline: { type: Boolean, default: false },
  canShadow: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { _id: true });

// A canvas object the admin placed in the builder (text field, element, image…).
const LayoutElementSchema = new Schema({
  type: { type: String, enum: ['text', 'element', 'icon', 'shape', 'image', 'qr'], required: true },
  refKey: { type: String, default: '' },      // textField key, or option id
  refId: { type: Schema.Types.ObjectId, default: null },
  x: { type: Number, default: 0.5 },
  y: { type: Number, default: 0.5 },
  width: { type: Number, default: 0.2 },
  height: { type: Number, default: 0.1 },
  rotation: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  layer: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  editable: { type: Boolean, default: true },
  meta: { type: Schema.Types.Mixed, default: {} },
}, { _id: true });

const NpTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'NpCategory', index: true },
    previewImageUrl: { type: String, default: '' },
    basePlateImageUrl: { type: String, default: '' },
    transparentPngUrl: { type: String, default: '' },
    widthMm: { type: Number, default: 300 },
    heightMm: { type: Number, default: 150 },
    basePricePaise: paiseField({ required: true }),
    // Optional "original" / MRP price shown struck-through when higher than the
    // selling price (basePricePaise). 0 = no compare-at price.
    compareAtPricePaise: paiseField({ default: 0 }),
    status: { type: String, enum: ['active', 'draft', 'hidden'], default: 'draft', index: true },

    // Whether this template offers a symbol at all. When false the builder shows
    // no symbol slot and the storefront hides the "Choose symbol" picker.
    symbolEnabled: { type: Boolean, default: true },
    // Placement of the customer-chosen symbol on the plate (normalized 0..1).
    // symbolScale = symbol box as a fraction of plate width (aspect preserved).
    symbolScale: { type: Number, default: 0.2, min: 0.02, max: 1 },
    symbolX: { type: Number, default: 0.5, min: 0, max: 1 },
    symbolY: { type: Number, default: 0.2, min: 0, max: 1 },

    // Dynamic customer inputs + the admin's canvas layout.
    textFields: { type: [TextFieldSchema], default: [] },
    layout: { type: [LayoutElementSchema], default: [] },

    // Which options this template exposes to the customer (empty = allow all active).
    allowedFonts: [{ type: Schema.Types.ObjectId, ref: 'NpFont' }],
    allowedColors: [{ type: Schema.Types.ObjectId, ref: 'NpColor' }],
    allowedElements: [{ type: Schema.Types.ObjectId, ref: 'NpElement' }],
    allowedShapes: [{ type: Schema.Types.ObjectId, ref: 'NpShape' }],
    allowedMaterials: [{ type: Schema.Types.ObjectId, ref: 'NpMaterial' }],
    allowedSizes: [{ type: Schema.Types.ObjectId, ref: 'NpSize' }],
    allowedBackgrounds: [{ type: Schema.Types.ObjectId, ref: 'NpBackground' }],

    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

NpTemplateSchema.index({ slug: 1 }, { unique: true, sparse: true });
NpTemplateSchema.pre('validate', function autoSlug(next) {
  if (!this.slug && this.name) this.slug = `${slugify(this.name)}-${String(this._id).slice(-6)}`;
  next();
});
NpTemplateSchema.plugin(moneyGuardPlugin);

const NpTemplate = model('NpTemplate', NpTemplateSchema);
export default NpTemplate;
