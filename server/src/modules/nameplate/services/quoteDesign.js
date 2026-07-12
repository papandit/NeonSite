// Server-authoritative price for a name-plate design (INVARIANT 2). Prices from
// the live template + option prices + price rules — never trusts a client price.
// Returns { pricePaise, breakdown, errors }.

import { getNpPriceRules } from '../models/NpPriceRules.js';
import {
  NpFont, NpColor, NpElement, NpIcon, NpMaterial, NpSize, NpBackground,
} from '../registry.js';

const OPTION_MODELS = {
  font: NpFont, color: NpColor, material: NpMaterial, size: NpSize, background: NpBackground,
};

async function findOption(Model, id) {
  if (!id) return null;
  try { return await Model.findOne({ _id: id, status: 'active' }).lean(); }
  catch { return null; }
}

/**
 * @param {object} template  NpTemplate (lean)
 * @param {object} design    { fields, selections:{font,color,material,size,background}, elements:[{id}] }
 */
export async function quoteNpDesign(template, design = {}) {
  const errors = [];
  const rules = await getNpPriceRules();
  const breakdown = [];
  let pricePaise = template.basePricePaise || 0;
  breakdown.push({ label: 'Base plate', amountPaise: pricePaise });

  // 1. Validate required text fields + count characters.
  let charCount = 0;
  const fields = design.fields || {};
  for (const tf of template.textFields || []) {
    if (tf.status === 'inactive') continue;
    const val = (fields[tf.key] ?? '').toString();
    if (tf.required && !val.trim()) errors.push(`${tf.label} is required`);
    if (val.length > (tf.maxLength || 999)) errors.push(`${tf.label} exceeds ${tf.maxLength} characters`);
    if (val.trim().length < (tf.minLength || 0)) errors.push(`${tf.label} needs at least ${tf.minLength} characters`);
    charCount += val.replace(/\s/g, '').length;
  }

  // 2. Extra-character charge beyond the free allowance.
  const billableChars = Math.max(0, charCount - (rules.freeCharacters || 0));
  if (billableChars > 0 && rules.extraCharPricePaise > 0) {
    const amt = billableChars * rules.extraCharPricePaise;
    pricePaise += amt;
    breakdown.push({ label: `${billableChars} characters`, amountPaise: amt });
  }

  // 3. Selected options (font/color/material/size/background): add their delta
  //    plus a premium surcharge when the delta is non-zero.
  const sel = design.selections || {};
  const premiumFor = { font: rules.premiumFontPricePaise, color: rules.premiumColorPricePaise };
  for (const [kind, Model] of Object.entries(OPTION_MODELS)) {
    const opt = await findOption(Model, sel[kind]);
    if (!opt) continue;
    if (rules.applyOptionDeltas && opt.priceDeltaPaise) {
      pricePaise += opt.priceDeltaPaise;
      breakdown.push({ label: opt.name, amountPaise: opt.priceDeltaPaise });
    }
    if (opt.priceDeltaPaise > 0 && premiumFor[kind]) {
      pricePaise += premiumFor[kind];
      breakdown.push({ label: `Premium ${kind}`, amountPaise: premiumFor[kind] });
    }
  }

  // 4. Symbols (elements or icons) — each one's own delta (+ premium surcharge).
  for (const el of design.elements || []) {
    const id = el.id || el._id;
    const opt = (await findOption(NpElement, id)) || (await findOption(NpIcon, id));
    if (!opt) continue;
    if (rules.applyOptionDeltas && opt.priceDeltaPaise) {
      pricePaise += opt.priceDeltaPaise;
      breakdown.push({ label: `Element: ${opt.name}`, amountPaise: opt.priceDeltaPaise });
    }
    if (opt.priceDeltaPaise > 0 && rules.premiumElementPricePaise) {
      pricePaise += rules.premiumElementPricePaise;
      breakdown.push({ label: 'Premium element', amountPaise: rules.premiumElementPricePaise });
    }
  }

  return { pricePaise, breakdown, errors, currency: rules.currency };
}

export default quoteNpDesign;
