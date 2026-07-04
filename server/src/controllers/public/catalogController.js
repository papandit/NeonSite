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

// Resolve an id-or-slug to a Category/SubCategory _id (or a non-matching id).
async function resolveId(Model, value) {
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) return value;
  const doc = await Model.findOne({ slug: value, status: 'active' }).select('_id');
  return doc ? doc._id : NON_MATCHING_ID;
}

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

  const filter = { status: 'active' };

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
      .select('-customizationConfig') // keep list payloads light
      .populate('category', 'name slug')
      .sort(sortSpec)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, items, 200, {
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

// GET /api/products/:slug/related — same category, excludes the product
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' })
    .select('_id category')
    .lean();
  if (!product) throw ApiError.notFound('Product not found');

  const related = await Product.find({
    status: 'active',
    _id: { $ne: product._id },
    ...(product.category ? { category: product.category } : {}),
  })
    .select('-customizationConfig')
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(8)
    .lean();

  return sendSuccess(res, related);
});
