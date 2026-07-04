// The full server-authoritative pricing pipeline for one design against one
// product: load live options -> validate -> computePrice -> refresh snapshots
// -> stamp authoritative pricing + designHash. Reused by /pricing/quote AND the
// cart (every cart write re-prices through this).

import { OPTION_BY_PANEL } from '../../models/options/registry.js';
import { PRICED_PANELS, SCHEMA_VERSION } from './constants.js';
import { computePrice, PricingError } from './computePrice.js';
import { validateDesign } from './validateDesign.js';
import { snapshotOption, designHash } from './snapshot.js';

function collectOptionIds(designDocument) {
  const byModel = new Map();
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

async function loadOptionsById(designDocument) {
  const byModel = collectOptionIds(designDocument);
  const optionsById = {};
  await Promise.all(
    [...byModel.values()].map(async ({ model, ids }) => {
      if (!ids.size) return;
      const list = await model.find({ _id: { $in: [...ids] } }).lean();
      for (const opt of list) optionsById[String(opt._id)] = opt;
    })
  );
  return optionsById;
}

/**
 * @param {object} product   lean product doc (basePricePaise + customizationConfig)
 * @param {object} designDocument
 * @returns {Promise<{ errors: string[], designDocument: object|null }>}
 */
export async function quoteDesign(product, designDocument) {
  const errors = validateDesign(product, designDocument);
  if (errors.length > 0) return { errors, designDocument: null };

  const optionsById = await loadOptionsById(designDocument);

  let pricing;
  try {
    pricing = computePrice(product, designDocument, optionsById);
  } catch (err) {
    if (err instanceof PricingError) return { errors: [err.message], designDocument: null };
    throw err;
  }

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
    authoritative: true,
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

  return { errors: [], designDocument: corrected };
}

export default quoteDesign;
