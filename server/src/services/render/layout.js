// Default layout generator. The editor writes designDocument.layout, but when
// it's absent (e.g. a reorder of an old design, or a server-only render) we
// synthesize sensible normalized positions from the text fields + icons.

/**
 * @param {object} designDocument
 * @returns {{ canvas: {aspect:string}, elements: Array }}
 */
export function ensureLayout(designDocument) {
  if (designDocument?.layout?.elements?.length) return designDocument.layout;

  const texts = designDocument?.text || [];
  const icons = designDocument?.icons || [];
  const elements = [];

  // Icons row across the top.
  icons.forEach((_, i) => {
    const n = icons.length;
    const x = n === 1 ? 0.5 : 0.2 + (0.6 * i) / Math.max(1, n - 1);
    elements.push({ type: 'icon', ref: i, x, y: 0.2, scale: 0.9 });
  });

  // Text lines stacked in the middle.
  const startY = icons.length ? 0.5 : 0.42;
  texts.forEach((t, i) => {
    elements.push({
      type: 'text',
      ref: t.field,
      x: 0.5,
      y: startY + i * 0.22,
      scale: i === 0 ? 1.0 : 0.6,
      align: 'center',
    });
  });

  return { canvas: { aspect: designDocument?.layout?.canvas?.aspect || '3:2' }, elements };
}

export default ensureLayout;
