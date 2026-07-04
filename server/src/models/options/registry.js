// The single registry of option collections. Everything that needs to iterate
// over options — the admin CRUD router, the pricing engine, the product
// validator — reads this so there's ONE list to maintain.
//
// `key`   : URL segment + customizationConfig panel key (e.g. 'materials').
// `panel` : the singular panel name used in Product.customizationConfig.
// `model` : the Mongoose model.
// `metaFields` : documents the expected meta shape (used by admin UI + docs).

import { buildOptionModel } from './optionModelFactory.js';

export const Material = buildOptionModel('Material');
export const Size = buildOptionModel('Size');
export const Color = buildOptionModel('Color');
export const Font = buildOptionModel('Font');
export const Border = buildOptionModel('Border');
export const Background = buildOptionModel('Background');
export const MountType = buildOptionModel('MountType');
export const Icon = buildOptionModel('Icon');

/**
 * @typedef {Object} OptionCollection
 * @property {string} key       plural URL key, e.g. 'materials'
 * @property {string} panel     singular config panel key, e.g. 'material'
 * @property {string} modelName Mongoose model name
 * @property {string} label     human label
 * @property {import('mongoose').Model} model
 * @property {Array<{name:string,type:string,label:string}>} metaFields
 */

/** @type {OptionCollection[]} */
export const OPTION_COLLECTIONS = [
  {
    key: 'materials',
    panel: 'material',
    modelName: 'Material',
    label: 'Materials',
    model: Material,
    metaFields: [],
  },
  {
    key: 'sizes',
    panel: 'size',
    modelName: 'Size',
    label: 'Sizes',
    model: Size,
    metaFields: [
      { name: 'widthMm', type: 'number', label: 'Width (mm)' },
      { name: 'heightMm', type: 'number', label: 'Height (mm)' },
    ],
  },
  {
    key: 'colors',
    panel: 'color',
    modelName: 'Color',
    label: 'Colors',
    model: Color,
    metaFields: [{ name: 'hex', type: 'color', label: 'Hex' }],
  },
  {
    key: 'fonts',
    panel: 'font',
    modelName: 'Font',
    label: 'Fonts',
    model: Font,
    metaFields: [
      { name: 'fileUrl', type: 'font', label: 'Font file (ttf/otf/woff)' },
      { name: 'format', type: 'text', label: 'Format' },
      { name: 'family', type: 'text', label: 'Family name' },
    ],
  },
  {
    key: 'borders',
    panel: 'border',
    modelName: 'Border',
    label: 'Borders',
    model: Border,
    metaFields: [],
  },
  {
    key: 'backgrounds',
    panel: 'background',
    modelName: 'Background',
    label: 'Backgrounds',
    model: Background,
    metaFields: [
      { name: 'type', type: 'text', label: 'Type (color/texture/image)' },
      { name: 'value', type: 'text', label: 'Value (hex or URL)' },
    ],
  },
  {
    key: 'mounttypes',
    panel: 'mountType',
    modelName: 'MountType',
    label: 'Mount Types',
    model: MountType,
    metaFields: [],
  },
  {
    key: 'icons',
    panel: 'icons',
    modelName: 'Icon',
    label: 'Icons',
    model: Icon,
    metaFields: [
      { name: 'svgUrl', type: 'svg', label: 'SVG file' },
      { name: 'group', type: 'text', label: 'Group' },
    ],
  },
];

/** Lookup by URL key, e.g. 'materials' -> collection. */
export const OPTION_BY_KEY = Object.fromEntries(
  OPTION_COLLECTIONS.map((c) => [c.key, c])
);

/** Lookup by config panel name, e.g. 'material' -> collection. */
export const OPTION_BY_PANEL = Object.fromEntries(
  OPTION_COLLECTIONS.map((c) => [c.panel, c])
);
