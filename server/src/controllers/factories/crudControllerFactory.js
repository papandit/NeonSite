// Generic CRUD controller factory. One implementation reused for categories,
// subcategories, and all 8 option collections — list, get, create, update,
// delete, toggle status. Keeps every collection consistent and DRY.

import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * @param {import('mongoose').Model} Model
 * @param {object} [opts]
 * @param {string[]} [opts.searchFields=['name']] fields matched by ?q=
 * @param {string} [opts.statusOn='active']
 * @param {string} [opts.statusOff='inactive']
 * @param {string|null} [opts.populate] path(s) to populate on reads
 * @param {(body:object, req:import('express').Request)=>Promise<object>|object} [opts.beforeWrite]
 *        validate/transform the payload before create/update
 * @param {string} [opts.defaultSort='sortOrder name']
 */
export function createCrudController(Model, opts = {}) {
  const {
    searchFields = ['name'],
    statusOn = 'active',
    statusOff = 'inactive',
    populate = null,
    beforeWrite = null,
    defaultSort = 'sortOrder name',
  } = opts;

  const applyPopulate = (q) => (populate ? q.populate(populate) : q);

  const list = asyncHandler(async (req, res) => {
    const {
      q,
      status,
      sort = defaultSort,
      page = '1',
      limit = '50',
      ...rest
    } = req.query;

    const filter = {};
    if (q && searchFields.length) {
      const rx = new RegExp(String(q).trim(), 'i');
      filter.$or = searchFields.map((f) => ({ [f]: rx }));
    }
    if (status) filter.status = status;

    // Allow simple exact-match filters passed through (e.g. ?category=<id>).
    for (const [k, v] of Object.entries(rest)) {
      if (['fields'].includes(k)) continue;
      filter[k] = v;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      applyPopulate(Model.find(filter).sort(sort).skip(skip).limit(limitNum)),
      Model.countDocuments(filter),
    ]);

    return sendSuccess(res, items, 200, {
      meta: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await applyPopulate(Model.findById(req.params.id));
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    return sendSuccess(res, doc);
  });

  const create = asyncHandler(async (req, res) => {
    const body = beforeWrite ? await beforeWrite(req.body, req) : req.body;
    const doc = await Model.create(body);
    const fresh = populate ? await applyPopulate(Model.findById(doc._id)) : doc;
    return sendSuccess(res, fresh, 201);
  });

  const update = asyncHandler(async (req, res) => {
    const body = beforeWrite ? await beforeWrite(req.body, req) : req.body;
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    Object.assign(doc, body);
    await doc.save(); // runs validators (incl. money guard)
    const fresh = populate ? await applyPopulate(Model.findById(doc._id)) : doc;
    return sendSuccess(res, fresh);
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    return sendSuccess(res, { id: req.params.id, deleted: true });
  });

  const toggleStatus = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    doc.status = doc.status === statusOn ? statusOff : statusOn;
    await doc.save();
    const fresh = populate ? await applyPopulate(Model.findById(doc._id)) : doc;
    return sendSuccess(res, fresh);
  });

  return { list, getOne, create, update, remove, toggleStatus };
}

export default createCrudController;
