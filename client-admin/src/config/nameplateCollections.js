// Admin config for the Name Plate Studio simple collections. Mirrors the server
// registry. `metaFields` drive the generic CRUD form (input: text|number|color|
// file with a `kind`). Adding a field here surfaces it in the admin instantly.

export const NP_COLLECTIONS = [
  { key: 'categories', label: 'Categories', metaFields: [
    { key: 'image', label: 'Preview image', input: 'file', kind: 'image' },
  ] },
  { key: 'fonts', label: 'Fonts', metaFields: [
    { key: 'fileUrl', label: 'Font file (ttf/otf/woff)', input: 'file', kind: 'font' },
    { key: 'family', label: 'CSS family name', input: 'text' },
    { key: 'format', label: 'Format', input: 'text' },
  ] },
  { key: 'colors', label: 'Colors', metaFields: [
    { key: 'hex', label: 'Hex', input: 'color' },
  ] },
  { key: 'elements', label: 'Elements', metaFields: [
    { key: 'image', label: 'Image (PNG)', input: 'file', kind: 'image' },
    { key: 'svg', label: 'SVG', input: 'file', kind: 'svg' },
    { key: 'group', label: 'Group', input: 'text' },
  ] },
  { key: 'icons', label: 'Icons', metaFields: [
    { key: 'svg', label: 'SVG', input: 'file', kind: 'svg' },
    { key: 'group', label: 'Group', input: 'text' },
  ] },
  { key: 'shapes', label: 'Shapes', metaFields: [
    { key: 'svg', label: 'SVG', input: 'file', kind: 'svg' },
    { key: 'thumbnail', label: 'Thumbnail', input: 'file', kind: 'image' },
  ] },
  { key: 'materials', label: 'Materials', metaFields: [
    { key: 'image', label: 'Image', input: 'file', kind: 'image' },
    { key: 'description', label: 'Description', input: 'text' },
  ] },
  { key: 'sizes', label: 'Sizes', metaFields: [
    { key: 'widthMm', label: 'Width (mm)', input: 'number' },
    { key: 'heightMm', label: 'Height (mm)', input: 'number' },
  ] },
  { key: 'backgrounds', label: 'Backgrounds', metaFields: [
    { key: 'image', label: 'Image / texture', input: 'file', kind: 'image' },
    { key: 'type', label: 'Type (color/texture)', input: 'text' },
  ] },
];

export const NP_BY_KEY = Object.fromEntries(NP_COLLECTIONS.map((c) => [c.key, c]));
