// Cart (auth). INVARIANT 2: EVERY write re-validates + re-prices the design via
// the shared quoteDesign pipeline and stores the SERVER unitPricePaise. A
// tampered client price is discarded.

import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import { quoteDesign } from '../services/pricing/quoteDesign.js';
import { repriceItem } from '../services/pricing/repriceItem.js';
import { quoteNeon } from '../services/neon/quoteNeon.js';
import { getNeonConfig } from '../models/NeonConfig.js';
import { getNeonProduct } from '../services/neon/neonProduct.js';
import NpTemplate from '../modules/nameplate/models/NpTemplate.js';
import { quoteNpDesign } from '../modules/nameplate/services/quoteDesign.js';
import { getNameplateProduct } from '../modules/nameplate/services/nameplateProduct.js';
import { NpColor, NpFont, NpElement, NpIcon, NpBackground } from '../modules/nameplate/registry.js';

// Snapshot human-readable names/images for the customer's name-plate choices so
// the order shows exactly what was selected, even if options change later.
const npElImg = (o) => o?.meta?.image || o?.meta?.svg || o?.imageUrl || o?.svg || '';
async function enrichNameplateSelections(selections = {}, elements = []) {
  const sel = { ...selections };
  if (sel.color && !sel.colorName) {
    const c = await NpColor.findById(sel.color).lean().catch(() => null);
    if (c) { sel.colorName = c.name; sel.colorHex = sel.colorHex || c.meta?.hex; }
  }
  if (sel.font && !sel.fontName) {
    const f = await NpFont.findById(sel.font).lean().catch(() => null);
    if (f) sel.fontName = f.name;
  }
  if (sel.background && !sel.backgroundName) {
    const b = await NpBackground.findById(sel.background).lean().catch(() => null);
    if (b) { sel.backgroundName = b.name; sel.backgroundImage = npElImg(b); }
  }
  const enrichedElements = [];
  for (const el of elements || []) {
    const id = el.id || el._id;
    if (!id) continue;
    const opt = (await NpElement.findById(id).lean().catch(() => null)) || (await NpIcon.findById(id).lean().catch(() => null));
    enrichedElements.push({ id: String(id), name: opt?.name || 'Symbol', image: npElImg(opt), colorHex: el.colorHex || null });
  }
  return { selections: sel, elements: enrichedElements };
}

// Add human-readable font/colour names to each per-field style.
async function enrichFieldStyles(fieldStyles = {}) {
  const out = {};
  for (const [key, st] of Object.entries(fieldStyles || {})) {
    const e = { ...st };
    if (st.color && !st.colorName) { const c = await NpColor.findById(st.color).lean().catch(() => null); if (c) e.colorName = c.name; }
    if (st.font && !st.fontName) { const f = await NpFont.findById(st.font).lean().catch(() => null); if (f) e.fontName = f.name; }
    out[key] = e;
  }
  return out;
}
import { getOrCreateCart, serializeCart } from '../services/cart/cartService.js';

async function repriceOrThrow(productId, designDocument) {
  const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found');
  const { errors, designDocument: corrected } = await repriceItem(product, designDocument);
  if (errors.length > 0) {
    throw ApiError.badRequest('Design is invalid', { code: 'DESIGN_INVALID', details: errors });
  }
  return corrected;
}

// Panels selected by default when buying "as-is".
const SINGLE_PANELS = ['material', 'size', 'color', 'border', 'background', 'mountType', 'font'];

// Server-authoritative colour choice: only a colour the product actually offers
// can be attached to the design. Accepts a hex string or a { hex } object; when
// the product has colours but none is chosen, defaults to the first offered.
function resolveProductColor(product, color) {
  const list = product.colors || [];
  if (!list.length) return null;
  const wanted = (typeof color === 'string' ? color : color?.hex || '').trim().toLowerCase();
  const match = wanted ? list.find((c) => (c.hex || '').trim().toLowerCase() === wanted) : null;
  const chosen = match || list[0];
  return { name: chosen.name || '', hex: chosen.hex };
}

// A valid default design so a product can be added to the cart without opening
// the editor (buy as-is): first allowed option per enabled panel; required text
// gets a placeholder the buyer can edit later.
function buildDefaultDesign(product) {
  const cfg = product.customizationConfig || {};
  const selections = {};
  for (const panel of SINGLE_PANELS) {
    const p = cfg[panel];
    if (p?.enabled && p.options?.length) {
      selections[panel] = { optionId: String(p.options[0]) };
    }
  }
  const text = (cfg.textFields || []).map((tf) => ({
    field: tf.key,
    value: tf.required ? 'Your Name' : '',
  }));
  return {
    schemaVersion: 1,
    productId: String(product._id),
    selections,
    icons: [],
    text,
    layout: {},
    render: {},
  };
}

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  return sendSuccess(res, await serializeCart(cart));
});

// POST /api/cart  { productId, designDocument, quantity }
export const addItem = asyncHandler(async (req, res) => {
  const { productId, designDocument, quantity = 1 } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('A valid productId is required');
  }
  if (!designDocument || typeof designDocument !== 'object') {
    throw ApiError.badRequest('designDocument is required');
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const corrected = await repriceOrThrow(productId, designDocument);

  const cart = await getOrCreateCart(req.user.id);
  cart.items.push({
    product: productId,
    designDocument: corrected,
    quantity: qty,
    unitPricePaise: corrected.pricing.subtotalPaise, // SERVER price
  });
  await cart.save();
  return sendSuccess(res, await serializeCart(cart), 201);
});

// POST /api/cart/quick  { productId, quantity, color } — add with a default design (buy as-is)
export const quickAdd = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, color } = req.body || {};
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw ApiError.badRequest('A valid productId is required');
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found');

  const { errors, designDocument: corrected } = await quoteDesign(product, buildDefaultDesign(product));
  if (errors.length > 0) {
    throw ApiError.badRequest('Could not build a default design for this product', { code: 'DESIGN_INVALID', details: errors });
  }

  // Freeze the buyer's colour choice onto the design (no price impact) so it
  // travels through the cart and is snapshotted onto the order.
  const chosenColor = resolveProductColor(product, color);
  if (chosenColor) corrected.selectedColor = chosenColor;

  const cart = await getOrCreateCart(req.user.id);
  cart.items.push({
    product: productId,
    designDocument: corrected,
    quantity: qty,
    unitPricePaise: corrected.pricing.subtotalPaise,
  });
  await cart.save();
  return sendSuccess(res, await serializeCart(cart), 201);
});

// POST /api/cart/neon  { spec, quantity } — add a neon sign (server-priced).
export const addNeonItem = asyncHandler(async (req, res) => {
  const { spec, quantity = 1 } = req.body || {};
  if (!spec || typeof spec !== 'object') {
    throw ApiError.badRequest('A neon spec is required');
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const config = await getNeonConfig();
  const { errors, designDocument } = quoteNeon(config, spec);
  if (errors.length > 0) {
    throw ApiError.badRequest('Neon design is invalid', { code: 'NEON_INVALID', details: errors });
  }

  const neonProduct = await getNeonProduct();
  const cart = await getOrCreateCart(req.user.id);
  cart.items.push({
    product: neonProduct._id,
    designDocument,
    quantity: qty,
    unitPricePaise: designDocument.pricing.subtotalPaise, // SERVER price
  });
  await cart.save();
  return sendSuccess(res, await serializeCart(cart), 201);
});

// POST /api/cart/nameplate  { templateSlug, design, canvas, previewImageUrl, quantity }
export const addNameplateItem = asyncHandler(async (req, res) => {
  const { templateSlug, design = {}, canvas = {}, previewImageUrl = null, quantity = 1 } = req.body || {};
  const template = await NpTemplate.findOne({ slug: templateSlug, status: 'active' }).lean();
  if (!template) throw ApiError.notFound('Name-plate template not found');
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const { pricePaise, breakdown, errors } = await quoteNpDesign(template, design);
  if (errors.length > 0) {
    throw ApiError.badRequest('Name-plate design is invalid', { code: 'NP_DESIGN_INVALID', details: errors });
  }

  const { selections: enrichedSelections, elements: enrichedElements } =
    await enrichNameplateSelections(design.selections || {}, design.elements || []);

  const designDocument = {
    schemaVersion: 1,
    kind: 'nameplate',
    nameplate: {
      templateId: String(template._id),
      templateSlug: template.slug,
      templateName: template.name,
      templateWidthMm: template.widthMm,
      templateHeightMm: template.heightMm,
      fields: design.fields || {},
      selections: enrichedSelections,
      fieldStyles: await enrichFieldStyles(design.fieldStyles || {}), // per-field font + colour (+ names)
      elements: enrichedElements,
      canvas,
    },
    render: { previewImageUrl },
    pricing: { currency: 'INR', authoritative: true, breakdown, subtotalPaise: pricePaise, computedAt: new Date().toISOString() },
  };

  const product = await getNameplateProduct();
  const cart = await getOrCreateCart(req.user.id);
  cart.items.push({ product: product._id, designDocument, quantity: qty, unitPricePaise: pricePaise });
  await cart.save();
  return sendSuccess(res, await serializeCart(cart), 201);
});

// PATCH /api/cart/:itemId  { quantity?, designDocument? }
export const updateItem = asyncHandler(async (req, res) => {
  const { quantity, designDocument } = req.body || {};
  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (designDocument && typeof designDocument === 'object') {
    const corrected = await repriceOrThrow(item.product, designDocument);
    item.designDocument = corrected;
    item.unitPricePaise = corrected.pricing.subtotalPaise; // re-priced
  }
  if (quantity !== undefined) {
    item.quantity = Math.max(1, parseInt(quantity, 10) || 1);
  }
  await cart.save();
  return sendSuccess(res, await serializeCart(cart));
});

// DELETE /api/cart/:itemId
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.deleteOne();
  await cart.save();
  return sendSuccess(res, await serializeCart(cart));
});

// DELETE /api/cart  (clear)
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = [];
  await cart.save();
  return sendSuccess(res, await serializeCart(cart));
});
