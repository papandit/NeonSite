// Shared pricing/design constants.

// Bump when the designDocument shape changes (INVARIANT: every stored copy
// carries schemaVersion).
export const SCHEMA_VERSION = 1;

// Single-select priced panels, in the order they appear in the breakdown.
export const PRICED_PANELS = [
  'material',
  'size',
  'color',
  'border',
  'background',
  'mountType',
  'font',
];

// All option panels (single-select ones + icons).
export const ALL_PANELS = [...PRICED_PANELS, 'icons'];
