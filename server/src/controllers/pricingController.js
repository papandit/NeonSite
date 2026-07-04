// POST /api/pricing/quote  (public)
// Validates a designDocument against the product, recomputes pricing from LIVE
// DB option prices, refreshes selection snapshots, and returns the corrected,
// server-authoritative document. The client's proposed pricing is ignored.

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import { OPTION_BY_PANEL } from '../models/options/registry.js';
import { PRICED_PANELS } from '../services/pricing/constants.js';
import { computePrice, PricingError } from '../services/pricing/computePrice.js';
import { validateDesign } from '../services/pricing/validateDesign.js';
import { snapshotOption, designHash } from '../services/pricing/snapshot.js';
import { SCHEMA_VERSION } from '../services/pricing/constants.js';

// Collect the selected option ids grouped by the model that owns them.
function collectOptionIds(designDocument) {
  const byModel = new Map(); // modelName -> Set(ids)
  const add = (panel, optionId) => {
    if (!optionId) return;
    const coll = OPTION_BY_PANEL[panel];
    if (!coll) return;
    if (!byModel.has(coll.modelName)) byModel.set(coll.modelName, { model: coll.model, ids: new Set() });
    byModel.get(coll.modelName).ids.add(String(optionId));
  };

  for (const panel of PRICED_PANELS) {
    const sel = designDocument?.selections?.[panel];
    if (sel?.optionId) add(panel, sel.optionId);
  }
  for (const icon of designDocument?.icons || []) {
    if (icon?.optionId) add('icons', icon.optionId);
  }
  return byModel;
}

// Fetch every referenced option and return a map id -> option doc.
async function loadOptionsById(designDocument) {
  const byModel = collectOptionIds(designDocument);
  const optionsById = {};
  await Promise.all(
    [...byModel.values()].map(async ({ model, ids }) => {
      const list = ids.size
        ? await model.find({ _id: { $in: [...ids] } }).lean()
        : [];
      for (const opt of list) optionsById[String(opt._id)] = opt;
    })
  );
  return optionsById;
}

export const quote = asyncHandler(async (req, res) => {
  const { productId, designDocument } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('A valid productId is required');
  }
  if (!designDocument || typeof designDocument !== 'object') {
    throw ApiError.badRequest('designDocument is required');
  }

  const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found');

  // 1. Structural validation against the product config.
  const errors = validateDesign(product, designDocument);
  if (errors.length > 0) {
    throw ApiError.badRequest('Design is invalid', { code: 'DESIGN_INVALID', details: errors });
  }

  // 2. Load live options and recompute price (ignores client pricing).
  const optionsById = await loadOptionsById(designDocument);
  let pricing;
  try {
    pricing = computePrice(product, designDocument, optionsById);
  } catch (err) {
    if (err instanceof PricingError) {
      throw ApiError.badRequest(err.message, { code: err.code, details: { panel: err.panel, optionId: err.optionId } });
    }
    throw err;
  }

  // 3. Build the corrected, authoritative document (refresh snapshots too).
  const corrected = {
    ...designDocument,
    schemaVersion: SCHEMA_VERSION,
    productId: String(product._id),
    selections: { ...(designDocument.selections || {}) },
    icons: [...(designDocument.icons || [])],
  };

  for (const panel of PRICED_PANELS) {
    const sel = corrected.selections[panel];
    if (sel?.optionId && optionsById[String(sel.optionId)]) {
      corrected.selections[panel] = {
        optionId: String(sel.optionId),
        snapshot: snapshotOption(optionsById[String(sel.optionId)]),
      };
    }
  }
  corrected.icons = corrected.icons.map((icon) => ({
    optionId: String(icon.optionId),
    snapshot: optionsById[String(icon.optionId)] ? snapshotOption(optionsById[String(icon.optionId)]) : icon.snapshot,
  }));

  corrected.pricing = {
    currency: 'INR',
    authoritative: true, // ONLY the server may set this
    basePricePaise: product.basePricePaise,
    breakdown: pricing.breakdown,
    subtotalPaise: pricing.subtotalPaise,
    computedAt: new Date().toISOString(),
  };

  corrected.render = {
    previewImageUrl: designDocument.render?.previewImageUrl || null,
    productionRenderUrl: designDocument.render?.productionRenderUrl || null,
    designHash: null,
  };
  corrected.render.designHash = designHash(corrected);

  return sendSuccess(res, { designDocument: corrected });
});
