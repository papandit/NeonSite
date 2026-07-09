// A saved customer name-plate design — the full JSON the customer built, plus
// the server-computed price and a preview image. Referenced by cart/order in a
// later phase; for now the studio can save + reload a design exactly.

import mongoose from 'mongoose';
import { paiseField, moneyGuardPlugin } from '../../../models/plugins/moneyGuard.js';

const { Schema, model } = mongoose;

const NpDesignSchema = new Schema(
  {
    template: { type: Schema.Types.ObjectId, ref: 'NpTemplate', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    // { fieldKey: value } for every text field the customer filled.
    fields: { type: Schema.Types.Mixed, default: {} },
    // Selected option snapshots (font/color/material/size/background) + elements.
    selections: { type: Schema.Types.Mixed, default: {} },
    elements: { type: [Schema.Types.Mixed], default: [] },
    // The full canvas JSON (positions, rotations, scales, per-object props).
    canvas: { type: Schema.Types.Mixed, default: {} },
    previewImageUrl: { type: String, default: '' },
    pricePaise: paiseField({ default: 0 }),
    breakdown: { type: [Schema.Types.Mixed], default: [] },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

NpDesignSchema.plugin(moneyGuardPlugin);

const NpDesign = model('NpDesign', NpDesignSchema);
export default NpDesign;
