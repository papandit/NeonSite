// Snapshotting (INVARIANT 5/8): freeze option values onto the design so
// historical orders survive later catalog edits. Plus a stable design hash.

import crypto from 'node:crypto';

/**
 * A frozen snapshot of the pricing-relevant fields of an option.
 * @param {object} opt live option doc
 */
export function snapshotOption(opt) {
  return {
    optionId: String(opt._id),
    name: opt.name,
    slug: opt.slug,
    priceDeltaPaise: opt.priceDeltaPaise || 0,
    meta: opt.meta || {},
  };
}

// Deterministic JSON with sorted keys (so equal designs hash equally).
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/**
 * sha256 of the normalized selections + text + icons + layout (ignores pricing
 * and render, which are derived).
 * @param {object} designDocument
 * @returns {string} hex digest
 */
export function designHash(designDocument) {
  const normalized = {
    schemaVersion: designDocument.schemaVersion,
    productId: String(designDocument.productId || ''),
    selections: Object.fromEntries(
      Object.entries(designDocument.selections || {}).map(([panel, sel]) => [
        panel,
        sel?.optionId ? String(sel.optionId) : null,
      ])
    ),
    text: (designDocument.text || []).map((t) => ({ field: t.field, value: t.value })),
    icons: (designDocument.icons || []).map((i) => String(i.optionId)),
    layout: designDocument.layout || {},
  };
  return crypto.createHash('sha256').update(stableStringify(normalized)).digest('hex');
}
