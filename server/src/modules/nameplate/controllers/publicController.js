// Public Name Plate Studio API (no auth for reads). Everything the customer
// designer renders comes from here — the template, its dynamic text fields, the
// admin's canvas layout, and the option lists (fonts/colors/elements/…). The
// price is always recomputed server-side.

import asyncHandler from '../../../utils/asyncHandler.js';
import { sendSuccess } from '../../../utils/apiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import NpTemplate from '../models/NpTemplate.js';
import NpDesign from '../models/NpDesign.js';
import { quoteNpDesign } from '../services/quoteDesign.js';
import {
  NpCategory, NpFont, NpColor, NpElement, NpShape, NpMaterial, NpSize, NpBackground,
} from '../registry.js';

// Return the template's allowed option ids, or ALL active options when the admin
// left the allow-list empty (empty = allow everything).
async function resolveOptions(Model, allowedIds) {
  if (Array.isArray(allowedIds) && allowedIds.length) {
    return Model.find({ _id: { $in: allowedIds }, status: 'active' }).sort('sortOrder name').lean();
  }
  return Model.find({ status: 'active' }).sort('sortOrder name').lean();
}

export const listCategories = asyncHandler(async (req, res) => {
  const cats = await NpCategory.find({ status: 'active' }).sort('sortOrder name').lean();
  return sendSuccess(res, cats);
});

export const listTemplates = asyncHandler(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.category) {
    const cat = await NpCategory.findOne({ slug: req.query.category }).select('_id').lean();
    filter.category = cat ? cat._id : '000000000000000000000000';
  }
  const items = await NpTemplate.find(filter)
    .select('name slug category previewImageUrl basePlateImageUrl widthMm heightMm basePricePaise')
    .populate('category', 'name slug')
    .sort('sortOrder -createdAt')
    .lean();
  return sendSuccess(res, items);
});

export const getTemplate = asyncHandler(async (req, res) => {
  const template = await NpTemplate.findOne({ slug: req.params.slug, status: 'active' })
    .populate('category', 'name slug')
    .populate('textFields.defaultFont', 'name meta')
    .lean();
  if (!template) throw ApiError.notFound('Template not found');

  // Resolve the option lists the designer needs.
  const [fonts, colors, elements, shapes, materials, sizes, backgrounds] = await Promise.all([
    resolveOptions(NpFont, template.allowedFonts),
    resolveOptions(NpColor, template.allowedColors),
    resolveOptions(NpElement, template.allowedElements),
    resolveOptions(NpShape, template.allowedShapes),
    resolveOptions(NpMaterial, template.allowedMaterials),
    resolveOptions(NpSize, template.allowedSizes),
    resolveOptions(NpBackground, template.allowedBackgrounds),
  ]);

  return sendSuccess(res, {
    template,
    options: { fonts, colors, elements, shapes, materials, sizes, backgrounds },
  });
});

export const quote = asyncHandler(async (req, res) => {
  const template = await NpTemplate.findOne({ slug: req.params.slug, status: 'active' }).lean();
  if (!template) throw ApiError.notFound('Template not found');
  const result = await quoteNpDesign(template, req.body?.design || req.body || {});
  return sendSuccess(res, result);
});

// POST /api/nameplate/designs — persist a customer design (user optional).
export const saveDesign = asyncHandler(async (req, res) => {
  const { templateSlug, fields, selections, elements, canvas, previewImageUrl } = req.body || {};
  const template = await NpTemplate.findOne({ slug: templateSlug, status: 'active' }).lean();
  if (!template) throw ApiError.notFound('Template not found');

  const { pricePaise, breakdown, errors } = await quoteNpDesign(template, { fields, selections, elements });
  if (errors.length) throw ApiError.badRequest('Design is invalid', { code: 'NP_DESIGN_INVALID', details: errors });

  const design = await NpDesign.create({
    template: template._id,
    user: req.user?.id || null,
    fields: fields || {},
    selections: selections || {},
    elements: elements || [],
    canvas: canvas || {},
    previewImageUrl: previewImageUrl || '',
    pricePaise,
    breakdown,
  });
  return sendSuccess(res, design, 201);
});
