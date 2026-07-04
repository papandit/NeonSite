import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const BannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '' },
    placement: {
      type: String,
      enum: ['home_hero', 'home_strip', 'promo'],
      default: 'home_hero',
      index: true,
    },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

const Banner = model('Banner', BannerSchema);
export default Banner;
