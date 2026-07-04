// Client-side mirror of the server option registry. Drives the shared
// OptionCrudPage: each collection's URL key, label, and its meta fields with
// the input type used to render them.
//
// input: 'number' | 'text' | 'color' | 'file'   (file uses kind: 'font'|'svg')

export const OPTION_COLLECTIONS = [
  { key: 'materials', label: 'Materials', metaFields: [] },
  {
    key: 'sizes',
    label: 'Sizes',
    metaFields: [
      { key: 'widthMm', label: 'Width (mm)', input: 'number' },
      { key: 'heightMm', label: 'Height (mm)', input: 'number' },
    ],
  },
  {
    key: 'colors',
    label: 'Colors',
    metaFields: [{ key: 'hex', label: 'Hex', input: 'color' }],
  },
  {
    key: 'fonts',
    label: 'Fonts',
    metaFields: [
      { key: 'family', label: 'Family name', input: 'text' },
      { key: 'fileUrl', label: 'Font file (ttf/otf/woff)', input: 'file', kind: 'font' },
      { key: 'format', label: 'Format', input: 'text' },
    ],
  },
  { key: 'borders', label: 'Borders', metaFields: [] },
  {
    key: 'backgrounds',
    label: 'Backgrounds',
    metaFields: [
      { key: 'type', label: 'Type (color/texture/image)', input: 'text' },
      { key: 'value', label: 'Value (hex or URL)', input: 'text' },
    ],
  },
  { key: 'mounttypes', label: 'Mount Types', metaFields: [] },
  {
    key: 'icons',
    label: 'Icons',
    metaFields: [
      { key: 'svgUrl', label: 'SVG file', input: 'file', kind: 'svg' },
      { key: 'group', label: 'Group', input: 'text' },
    ],
  },
];

export const OPTION_BY_KEY = Object.fromEntries(
  OPTION_COLLECTIONS.map((c) => [c.key, c])
);
