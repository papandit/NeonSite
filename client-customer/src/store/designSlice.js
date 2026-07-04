// The canonical designDocument, client-side (INVARIANT 3). The editor writes
// selections/text/icons/layout; the server owns pricing (applyQuote overwrites
// it — the client never trusts its own prices).

import { createSlice } from '@reduxjs/toolkit';
import { buildDefaultLayout, aspectFromSizeMeta } from '../configurator/layout';

export const SCHEMA_VERSION = 1;
export const SINGLE_PANELS = ['material', 'size', 'color', 'border', 'background', 'mountType', 'font'];

const snapshotOf = (opt) => ({
  optionId: opt._id,
  name: opt.name,
  slug: opt.slug,
  priceDeltaPaise: opt.priceDeltaPaise || 0,
  meta: opt.meta || {},
});

const emptyDesign = () => ({
  schemaVersion: SCHEMA_VERSION,
  productId: null,
  selections: {},
  text: [],
  icons: [],
  layout: { canvas: { aspect: '3:2' }, elements: [] },
  render: { previewImageUrl: null, productionRenderUrl: null, designHash: null },
  pricing: { currency: 'INR', authoritative: false, basePricePaise: 0, breakdown: [], subtotalPaise: 0, computedAt: null },
});

function rebuildLayout(state) {
  const aspect = aspectFromSizeMeta(state.selections.size?.snapshot?.meta) || state.layout.canvas.aspect;
  state.layout = buildDefaultLayout(state.text, state.icons, aspect);
}

const designSlice = createSlice({
  name: 'design',
  initialState: emptyDesign(),
  reducers: {
    initDesign: {
      reducer(state, action) {
        const { product } = action.payload;
        const fresh = emptyDesign();
        fresh.productId = product._id;
        fresh.pricing.basePricePaise = product.basePricePaise;

        const cfg = product.customizationConfig || {};
        // Auto-select the first allowed option for each enabled single-select panel.
        for (const panel of SINGLE_PANELS) {
          const p = cfg[panel];
          if (p?.enabled && p.options?.length) {
            fresh.selections[panel] = { optionId: p.options[0]._id, snapshot: snapshotOf(p.options[0]) };
          }
        }
        // Text fields start empty.
        fresh.text = (cfg.textFields || []).map((tf) => ({ field: tf.key, value: '' }));
        fresh.layout = buildDefaultLayout(
          fresh.text,
          fresh.icons,
          aspectFromSizeMeta(fresh.selections.size?.snapshot?.meta)
        );
        return fresh;
      },
      prepare(product) {
        return { payload: { product } };
      },
    },

    setSelection(state, action) {
      const { panel, option } = action.payload;
      state.selections[panel] = { optionId: option._id, snapshot: snapshotOf(option) };
      if (panel === 'size') rebuildLayout(state);
    },

    setText(state, action) {
      const { field, value } = action.payload;
      const existing = state.text.find((t) => t.field === field);
      if (existing) existing.value = value;
      else state.text.push({ field, value });
    },

    toggleIcon(state, action) {
      const { option, max } = action.payload;
      const idx = state.icons.findIndex((i) => i.optionId === option._id);
      if (idx >= 0) {
        state.icons.splice(idx, 1);
      } else if (state.icons.length < max) {
        state.icons.push({ optionId: option._id, snapshot: snapshotOf(option) });
      }
      rebuildLayout(state);
    },

    moveElement(state, action) {
      const { index, x, y } = action.payload;
      const el = state.layout.elements[index];
      if (el) {
        el.x = x;
        el.y = y;
      }
    },

    // Server quote is authoritative — overwrite pricing + hash.
    applyQuote(state, action) {
      const d = action.payload;
      state.pricing = d.pricing;
      state.render.designHash = d.render?.designHash || null;
    },

    setPreview(state, action) {
      state.render.previewImageUrl = action.payload;
    },

    resetDesign() {
      return emptyDesign();
    },
  },
});

export const {
  initDesign,
  setSelection,
  setText,
  toggleIcon,
  moveElement,
  applyQuote,
  setPreview,
  resetDesign,
} = designSlice.actions;

// A plain object suitable for POSTing to /pricing/quote.
export const selectDesignDocument = (state) => state.design;
export const selectPricing = (state) => state.design.pricing;
export const selectSelections = (state) => state.design.selections;
export const selectIcons = (state) => state.design.icons;
export const selectText = (state) => state.design.text;

export default designSlice.reducer;
