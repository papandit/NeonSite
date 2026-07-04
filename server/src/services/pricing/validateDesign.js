// Validates a designDocument against a product's customizationConfig WITHOUT
// touching the DB (pure). Returns an array of human-readable error strings
// (empty = valid). Active-status of options is checked later by computePrice.

import { PRICED_PANELS } from './constants.js';

function allowedIdSet(product, panel) {
  const opts = product?.customizationConfig?.[panel]?.options || [];
  return new Set(opts.map((o) => String(o._id ?? o)));
}

/**
 * @param {object} product
 * @param {object} designDocument
 * @returns {string[]} errors (empty if valid)
 */
export function validateDesign(product, designDocument) {
  const errors = [];
  const cfg = product?.customizationConfig || {};
  const selections = designDocument?.selections || {};
  const icons = Array.isArray(designDocument?.icons) ? designDocument.icons : [];

  // Single-select panels: required + allowed + enabled.
  for (const panel of PRICED_PANELS) {
    const panelCfg = cfg[panel];
    const sel = selections[panel];
    const hasSel = Boolean(sel && sel.optionId);

    if (panelCfg?.enabled && panelCfg?.required && !hasSel) {
      errors.push(`${panel} is required`);
    }
    if (hasSel) {
      if (!panelCfg?.enabled) {
        errors.push(`${panel} is not available for this product`);
      } else if (!allowedIdSet(product, panel).has(String(sel.optionId))) {
        errors.push(`selected ${panel} is not an allowed option`);
      }
    }
  }

  // Icons: enabled, required, count <= max, each allowed.
  const iconsCfg = cfg.icons;
  if (icons.length > 0) {
    if (!iconsCfg?.enabled) {
      errors.push('icons are not available for this product');
    } else {
      const max = iconsCfg.max ?? 0;
      if (icons.length > max) errors.push(`too many icons (max ${max})`);
      const allowed = allowedIdSet(product, 'icons');
      for (const icon of icons) {
        if (!allowed.has(String(icon.optionId))) {
          errors.push('an icon is not an allowed option');
          break;
        }
      }
    }
  } else if (iconsCfg?.enabled && iconsCfg?.required) {
    errors.push('at least one icon is required');
  }

  // Text fields: required + maxLength + only known keys.
  const textFields = cfg.textFields || [];
  const knownKeys = new Set(textFields.map((t) => t.key));
  const providedByKey = {};
  for (const t of designDocument?.text || []) {
    providedByKey[t.field] = t.value;
    if (!knownKeys.has(t.field)) {
      errors.push(`unknown text field "${t.field}"`);
    }
  }
  for (const tf of textFields) {
    const value = providedByKey[tf.key];
    const hasValue = typeof value === 'string' && value.trim() !== '';
    if (tf.required && !hasValue) {
      errors.push(`text "${tf.label || tf.key}" is required`);
    }
    if (typeof value === 'string' && value.length > tf.maxLength) {
      errors.push(`text "${tf.label || tf.key}" exceeds ${tf.maxLength} characters`);
    }
  }

  return errors;
}

export default validateDesign;
