// Product CRUD. Uses the generic factory but with a beforeWrite hook that
// validates every option id referenced in customizationConfig actually exists
// in the right collection (invariant: a product can only expose real options).

import ApiError from '../../utils/ApiError.js';
import Product from '../../models/Product.js';
import { OPTION_BY_PANEL } from '../../models/options/registry.js';
import { createCrudController } from '../factories/crudControllerFactory.js';

// Panels that reference an option collection (textFields is not an option list).
const OPTION_PANELS = [
  'material',
  'size',
  'font',
  'color',
  'background',
  'border',
  'mountType',
  'icons',
];

/**
 * Validate that each customizationConfig panel's option ids exist and belong to
 * the correct collection. Throws ApiError on any unknown id.
 */
async function validateConfigOptions(config) {
  if (!config) return;
  for (const panel of OPTION_PANELS) {
    const panelCfg = config[panel];
    if (!panelCfg || !Array.isArray(panelCfg.options) || panelCfg.options.length === 0) {
      continue;
    }
    const collection = OPTION_BY_PANEL[panel];
    if (!collection) continue;

    const ids = panelCfg.options.map(String);
    const found = await collection.model.countDocuments({ _id: { $in: ids } });
    if (found !== new Set(ids).size) {
      throw ApiError.badRequest(
        `customizationConfig.${panel} references option(s) that do not exist in ${collection.modelName}`,
        { code: 'INVALID_OPTION_REF' }
      );
    }
  }
}

async function beforeWrite(body) {
  await validateConfigOptions(body.customizationConfig);
  return body;
}

const controller = createCrudController(Product, {
  searchFields: ['name', 'slug'],
  statusOn: 'active',
  statusOff: 'hidden',
  populate: 'category subCategory',
  beforeWrite,
  defaultSort: '-createdAt',
});

export default controller;
