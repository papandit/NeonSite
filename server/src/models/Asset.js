// Binary asset stored directly in MongoDB — the fallback image/file store used
// when Cloudinary isn't configured. Uploaded files (≤5MB, well under Mongo's
// 16MB doc limit) live here and are served by GET /api/assets/:id. No client
// secret is ever exposed (INVARIANT 7 stays satisfied — server-proxied only).

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AssetSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    filename: { type: String, default: '' },
    kind: { type: String, enum: ['image', 'font', 'svg'], default: 'image' },
    folder: { type: String, default: '' },
    bytes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Asset = model('Asset', AssetSchema);
export default Asset;
