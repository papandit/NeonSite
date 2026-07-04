// Unit tests for the pricing engine + validator. Run: npm test (node --test).
// This is the highest-value test in the codebase — silent revenue bugs live here.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computePrice, PricingError } from './computePrice.js';
import { validateDesign } from './validateDesign.js';

const product = {
  basePricePaise: 149900,
  customizationConfig: {
    material: { enabled: true, required: true, options: [{ _id: 'mat_wood' }, { _id: 'mat_acrylic' }] },
    size: { enabled: true, required: true, options: [{ _id: 'size_s' }, { _id: 'size_l' }] },
    color: { enabled: true, required: false, options: [{ _id: 'col_gold' }] },
    font: { enabled: true, required: false, options: [{ _id: 'font_x' }] },
    border: { enabled: false, options: [] },
    background: { enabled: false, options: [] },
    mountType: { enabled: false, options: [] },
    icons: { enabled: true, required: false, max: 2, options: [{ _id: 'icn_a' }, { _id: 'icn_b' }] },
    textFields: [{ key: 'familyName', label: 'Family', required: true, maxLength: 10 }],
  },
};

const optionsById = {
  mat_wood: { _id: 'mat_wood', name: 'Wood', priceDeltaPaise: 30000, status: 'active' },
  mat_acrylic: { _id: 'mat_acrylic', name: 'Acrylic', priceDeltaPaise: 20000, status: 'active' },
  size_l: { _id: 'size_l', name: '18x12', priceDeltaPaise: 50000, status: 'active' },
  col_gold: { _id: 'col_gold', name: 'Golden', priceDeltaPaise: 25000, status: 'active' },
  icn_a: { _id: 'icn_a', name: 'Ganesh', priceDeltaPaise: 15000, status: 'active' },
  icn_b: { _id: 'icn_b', name: 'Om', priceDeltaPaise: 10000, status: 'active' },
  mat_inactive: { _id: 'mat_inactive', name: 'Retired', priceDeltaPaise: 1, status: 'inactive' },
};

const validDesign = () => ({
  selections: {
    material: { optionId: 'mat_wood' },
    size: { optionId: 'size_l' },
    color: { optionId: 'col_gold' },
  },
  icons: [{ optionId: 'icn_a' }],
  text: [{ field: 'familyName', value: 'Parmar' }],
});

// ---- computePrice ---------------------------------------------------------

test('base-only design returns just the base price', () => {
  const { breakdown, subtotalPaise } = computePrice(product, { selections: {}, icons: [] }, optionsById);
  assert.equal(subtotalPaise, 149900);
  assert.equal(breakdown.length, 1);
  assert.equal(breakdown[0].label, 'Base');
});

test('sums base + selections + icons as integer paise', () => {
  const { breakdown, subtotalPaise } = computePrice(product, validDesign(), optionsById);
  // 149900 + 30000 + 50000 + 25000 + 15000
  assert.equal(subtotalPaise, 269900);
  assert.ok(Number.isInteger(subtotalPaise));
  assert.equal(breakdown.length, 5); // base + material + size + color + icon
  assert.deepEqual(
    breakdown.map((b) => b.amountPaise),
    [149900, 30000, 50000, 25000, 15000]
  );
});

test('two icons are each priced', () => {
  const d = validDesign();
  d.icons = [{ optionId: 'icn_a' }, { optionId: 'icn_b' }];
  const { subtotalPaise } = computePrice(product, d, optionsById);
  assert.equal(subtotalPaise, 269900 + 10000);
});

test('rejects an inactive option', () => {
  const d = validDesign();
  d.selections.material = { optionId: 'mat_inactive' };
  assert.throws(() => computePrice(product, d, optionsById), (e) => e instanceof PricingError && e.code === 'OPTION_INACTIVE');
});

test('rejects an option not allowed by the product config', () => {
  const d = validDesign();
  optionsById.col_rogue = { _id: 'col_rogue', name: 'Rogue', priceDeltaPaise: 999999, status: 'active' };
  d.selections.color = { optionId: 'col_rogue' };
  assert.throws(() => computePrice(product, d, optionsById), (e) => e instanceof PricingError && e.code === 'OPTION_NOT_ALLOWED');
  delete optionsById.col_rogue;
});

test('rejects a missing option', () => {
  const d = validDesign();
  d.selections.material = { optionId: 'does_not_exist' };
  assert.throws(() => computePrice(product, d, optionsById), (e) => e instanceof PricingError && e.code === 'OPTION_NOT_FOUND');
});

test('ignores client-sent pricing entirely (recomputes from options)', () => {
  const d = validDesign();
  d.pricing = { authoritative: true, subtotalPaise: 1 }; // malicious client value
  const { subtotalPaise } = computePrice(product, d, optionsById);
  assert.equal(subtotalPaise, 269900); // server value wins
});

// ---- validateDesign -------------------------------------------------------

test('valid design has no errors', () => {
  assert.deepEqual(validateDesign(product, validDesign()), []);
});

test('missing required panel is reported', () => {
  const d = validDesign();
  delete d.selections.material;
  const errors = validateDesign(product, d);
  assert.ok(errors.some((e) => e.includes('material is required')));
});

test('text over maxLength is reported', () => {
  const d = validDesign();
  d.text = [{ field: 'familyName', value: 'ThisNameIsWayTooLong' }];
  const errors = validateDesign(product, d);
  assert.ok(errors.some((e) => e.includes('exceeds 10')));
});

test('too many icons is reported', () => {
  const d = validDesign();
  d.icons = [{ optionId: 'icn_a' }, { optionId: 'icn_b' }, { optionId: 'icn_a' }];
  const errors = validateDesign(product, d);
  assert.ok(errors.some((e) => e.includes('too many icons')));
});

test('required text missing is reported', () => {
  const d = validDesign();
  d.text = [];
  const errors = validateDesign(product, d);
  assert.ok(errors.some((e) => e.includes('is required')));
});
