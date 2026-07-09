// The single registry of Name Plate Studio option collections. Admin CRUD
// routes, the admin nav, and the public read API all iterate this list, so
// adding a collection is a one-line change here (+ mirror in the admin config).
//
// `key`        : URL segment, e.g. 'fonts' -> /api/admin/nameplate/fonts
// `label`      : human label for the admin UI
// `model`      : the Mongoose model (built from the shared factory)
// `searchable` : fields matched by ?q=

import { buildNpOptionModel } from './models/npOptionModel.js';

export const NpCategory = buildNpOptionModel('NpCategory');
export const NpFont = buildNpOptionModel('NpFont');
export const NpColor = buildNpOptionModel('NpColor');
export const NpElement = buildNpOptionModel('NpElement');
export const NpIcon = buildNpOptionModel('NpIcon');
export const NpShape = buildNpOptionModel('NpShape');
export const NpMaterial = buildNpOptionModel('NpMaterial');
export const NpSize = buildNpOptionModel('NpSize');
export const NpBackground = buildNpOptionModel('NpBackground');

export const NP_COLLECTIONS = [
  { key: 'categories', label: 'Categories', model: NpCategory },
  { key: 'fonts', label: 'Fonts', model: NpFont },
  { key: 'colors', label: 'Colors', model: NpColor },
  { key: 'elements', label: 'Elements', model: NpElement },
  { key: 'icons', label: 'Icons', model: NpIcon },
  { key: 'shapes', label: 'Shapes', model: NpShape },
  { key: 'materials', label: 'Materials', model: NpMaterial },
  { key: 'sizes', label: 'Sizes', model: NpSize },
  { key: 'backgrounds', label: 'Backgrounds', model: NpBackground },
];

export const NP_BY_KEY = Object.fromEntries(NP_COLLECTIONS.map((c) => [c.key, c]));
