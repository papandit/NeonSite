// Public, read-only catalog endpoints (no auth). Only 'active' catalog data is
// exposed. Product-by-slug returns the customizationConfig with each allowed
// option fully populated so the storefront editor can render panels directly.

import mongoose from 'mongoose';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import ApiError from '../../utils/ApiError.js';
import Category from '../../models/Category.js';
import SubCategory from '../../models/SubCategory.js';
import Product from '../../models/Product.js';
import Banner from '../../models/Banner.js';

// Config panels that reference an option collection.
const CONFIG_PANELS = [
  'material', 'size', 'font', 'color', 'background', 'border', 'mountType', 'icons',
];

const SORTS = {
  newest: '-createdAt',
  oldest: 'createdAt',
  price_asc: 'basePricePaise',
  price_desc: '-basePricePaise',
  rating: '-rating',
  name: 'name',
};

const NON_MATCHING_ID = '000000000000000000000000';

// Light list projection: everything a card needs, plus the product's colour
// panel so we can surface swatches — without the heavy full customizationConfig.
const CARD_SELECT =
  'name slug images colors basePricePaise compareAtPricePaise rating category subCategory status createdAt customizationConfig.color';
const COLOR_POPULATE = { path: 'customizationConfig.color.options', match: { status: 'active' }, select: 'name meta' };

// Turn a populated product into a card payload: derive colour swatches and drop
// the config so the response stays small. Prefer the product's own `colors`
// (the simple store field); fall back to the customizationConfig colour panel.
function toCard(p) {
  let swatches = (p.colors || [])
    .map((c) => ({ name: c.name, hex: c.hex }))
    .filter((s) => s.hex);
  if (!swatches.length) {
    swatches = (p.customizationConfig?.color?.options || [])
      .map((o) => ({ name: o.name, hex: o.meta?.hex }))
      .filter((s) => s.hex);
  }
  const { customizationConfig, ...rest } = p;
  return { ...rest, swatches };
}

// Resolve an id-or-slug to a Category/SubCategory _id (or a non-matching id).
async function resolveId(Model, value) {
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) return value;
  const doc = await Model.findOne({ slug: value, status: 'active' }).select('_id');
  return doc ? doc._id : NON_MATCHING_ID;
}

// GET /api/banners?placement=home_hero — active banners (managed in admin)
export const listBanners = asyncHandler(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.placement) filter.placement = req.query.placement;
  const banners = await Banner.find(filter).sort('sortOrder').lean();
  return sendSuccess(res, banners);
});

// GET /api/categories  — active categories (+ their active subcategories)
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ status: 'active' }).sort('sortOrder name').lean();
  const subs = await SubCategory.find({ status: 'active' }).sort('sortOrder name').lean();
  const byCat = subs.reduce((acc, s) => {
    const key = String(s.category);
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const withSubs = categories.map((c) => ({
    ...c,
    subCategories: byCat[String(c._id)] || [],
  }));
  return sendSuccess(res, withSubs);
});

// GET /api/products?category=&subcategory=&q=&sort=&page=&limit=
export const listProducts = asyncHandler(async (req, res) => {
  const { q, sort = 'newest', page = '1', limit = '12' } = req.query;

  // Exclude the neon anchor product — it's bought via the Neon Studio, not the
  // regular catalog listing.
  const filter = { status: 'active', kind: { $nin: ['neon', 'nameplate'] } };

  const categoryId = await resolveId(Category, req.query.category);
  if (categoryId) filter.category = categoryId;
  const subCategoryId = await resolveId(SubCategory, req.query.subcategory);
  if (subCategoryId) filter.subCategory = subCategoryId;

  if (q && String(q).trim()) {
    filter.name = new RegExp(String(q).trim(), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(60, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;
  const sortSpec = SORTS[sort] || SORTS.newest;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(CARD_SELECT)
      .populate('category', 'name slug')
      .populate(COLOR_POPULATE)
      .sort(sortSpec)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, items.map(toCard), 200, {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      sort,
    },
  });
});

// GET /api/products/:slug — full product with populated customizationConfig
export const getProductBySlug = asyncHandler(async (req, res) => {
  const populateConfig = CONFIG_PANELS.map((panel) => ({
    path: `customizationConfig.${panel}.options`,
    match: { status: 'active' },
  }));

  const product = await Product.findOne({ slug: req.params.slug, status: 'active' })
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .populate(populateConfig)
    .lean();

  if (!product) throw ApiError.notFound('Product not found');
  return sendSuccess(res, product);
});

// GET /api/products/:slug/related — "Similar products": same category first,
// topped up with other active products so the row is never empty.
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' })
    .select('_id category')
    .lean();
  if (!product) throw ApiError.notFound('Product not found');

  const limit = 8;

  let items = product.category
    ? await Product.find({ status: 'active', kind: { $nin: ['neon', 'nameplate'] }, _id: { $ne: product._id }, category: product.category })
        .select(CARD_SELECT).populate('category', 'name slug').populate(COLOR_POPULATE).sort('-rating -createdAt').limit(limit).lean()
    : [];

  // Top up with other active products if the category is thin.
  if (items.length < limit) {
    const have = new Set([String(product._id), ...items.map((p) => String(p._id))]);
    const extra = await Product.find({ status: 'active', kind: { $nin: ['neon', 'nameplate'] }, _id: { $nin: [...have] } })
      .select(CARD_SELECT).populate('category', 'name slug').populate(COLOR_POPULATE).sort('-rating -createdAt').limit(limit - items.length).lean();
    items = items.concat(extra);
  }

  return sendSuccess(res, items.map(toCard));
});

// GET /api/products/recommended?exclude=slug&limit= — "More products for you":
// top-rated active products (a lightweight recommendation).
export const getRecommendedProducts = asyncHandler(async (req, res) => {
  const { exclude } = req.query;
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 8));

  const filter = { status: 'active', kind: { $nin: ['neon', 'nameplate'] } };
  if (exclude) {
    const ex = await Product.findOne({ slug: exclude }).select('_id').lean();
    if (ex) filter._id = { $ne: ex._id };
  }

  const items = await Product.find(filter)
    .select(CARD_SELECT)
    .populate('category', 'name slug')
    .populate(COLOR_POPULATE)
    .sort('-rating -createdAt')
    .limit(limit)
    .lean();

  return sendSuccess(res, items.map(toCard));
});
