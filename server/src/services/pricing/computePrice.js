// PURE pricing function (INVARIANTS 1 & 2). Same inputs -> same output.
// It does NOT touch the DB; the caller resolves live option docs and passes
// them in as `optionsById`. This keeps it deterministic and unit-testable.
//
//   computePrice(product, designDocument, optionsById) -> { breakdown, subtotalPaise }
//
// All amounts are integer paise. Throws PricingError if a selected option is
// missing, inactive, or not allowed by the product's customizationConfig.

import { PRICED_PANELS } from './constants.js';

export class PricingError extends Error {
  constructor(message, { code = 'PRICING_ERROR', panel, optionId } = {}) {
    super(message);
    this.name = 'PricingError';
    this.code = code;
    this.panel = panel;
    this.optionId = optionId;
  }
}

// Set of allowed option ids for a panel, as strings.
function allowedIds(product, panel) {
  const cfg = product?.customizationConfig?.[panel];
  const opts = cfg?.options || [];
  return new Set(opts.map((o) => String(o._id ?? o)));
}

function lookupActiveAllowed(optionsById, product, panel, optionId) {
  const id = String(optionId);
  const opt = optionsById[id];
  if (!opt) {
    throw new PricingError(`Option not found for ${panel}`, { code: 'OPTION_NOT_FOUND', panel, optionId: id });
  }
  if (opt.status !== 'active') {
    throw new PricingError(`Option "${opt.name}" is not active`, { code: 'OPTION_INACTIVE', panel, optionId: id });
  }
  if (!allowedIds(product, panel).has(id)) {
    throw new PricingError(`Option "${opt.name}" is not allowed for this product's ${panel}`, {
      code: 'OPTION_NOT_ALLOWED',
      panel,
      optionId: id,
    });
  }
  return opt;
}

/**
 * @param {object} product        product doc (basePricePaise + customizationConfig)
 * @param {object} designDocument the canonical design doc
 * @param {Record<string, object>} optionsById  live option docs keyed by id
 * @returns {{ breakdown: Array<{label:string, amountPaise:number, panel?:string, optionId?:string}>, subtotalPaise: number }}
 */
export function computePrice(product, designDocument, optionsById) {
  if (!product || typeof product.basePricePaise !== 'number') {
    throw new PricingError('Invalid product / base price', { code: 'INVALID_PRODUCT' });
  }
  const base = product.basePricePaise;
  if (!Number.isInteger(base) || base < 0) {
    throw new PricingError('Base price must be a non-negative integer (paise)', { code: 'INVALID_BASE_PRICE' });
  }

  const breakdown = [{ label: 'Base', amountPaise: base }];

  const selections = designDocument?.selections || {};

  // Single-select priced panels.
  for (const panel of PRICED_PANELS) {
    const sel = selections[panel];
    if (!sel || !sel.optionId) continue; // panel not selected — skip
    const cfg = product.customizationConfig?.[panel];
    if (!cfg?.enabled) {
      throw new PricingError(`Panel "${panel}" is not enabled for this product`, { code: 'PANEL_DISABLED', panel });
    }
    const opt = lookupActiveAllowed(optionsById, product, panel, sel.optionId);
    const amount = opt.priceDeltaPaise || 0;
    if (!Number.isInteger(amount)) {
      throw new PricingError(`Option "${opt.name}" has a non-integer price`, { code: 'BAD_OPTION_PRICE', panel });
    }
    breakdown.push({ label: opt.name, amountPaise: amount, panel, optionId: String(sel.optionId) });
  }

  // Icons — repeatable, each priced per unit.
  const icons = Array.isArray(designDocument?.icons) ? designDocument.icons : [];
  if (icons.length > 0) {
    const iconsCfg = product.customizationConfig?.icons;
    if (!iconsCfg?.enabled) {
      throw new PricingError('Icons are not enabled for this product', { code: 'PANEL_DISABLED', panel: 'icons' });
    }
    for (const icon of icons) {
      const opt = lookupActiveAllowed(optionsById, product, 'icons', icon.optionId);
      const amount = opt.priceDeltaPaise || 0;
      breakdown.push({ label: `Icon: ${opt.name}`, amountPaise: amount, panel: 'icons', optionId: String(icon.optionId) });
    }
  }

  const subtotalPaise = breakdown.reduce((sum, line) => sum + line.amountPaise, 0);

  return { breakdown, subtotalPaise };
}

export default computePrice;
