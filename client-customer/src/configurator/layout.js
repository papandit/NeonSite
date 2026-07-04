// Client mirror of the server's default layout (normalized 0..1 coordinates).
// The editor may move elements; positions are stored back on the design.

export function buildDefaultLayout(text = [], icons = [], aspect = '3:2') {
  const elements = [];

  icons.forEach((_, i) => {
    const n = icons.length;
    const x = n === 1 ? 0.5 : 0.2 + (0.6 * i) / Math.max(1, n - 1);
    elements.push({ type: 'icon', ref: i, x, y: 0.2, scale: 0.9 });
  });

  const startY = icons.length ? 0.5 : 0.42;
  text.forEach((t, i) => {
    elements.push({
      type: 'text',
      ref: t.field,
      x: 0.5,
      y: startY + i * 0.22,
      scale: i === 0 ? 1.0 : 0.6,
      align: 'center',
    });
  });

  return { canvas: { aspect }, elements };
}

export function aspectFromSizeMeta(meta) {
  if (meta && Number(meta.widthMm) > 0 && Number(meta.heightMm) > 0) {
    return `${meta.widthMm}:${meta.heightMm}`;
  }
  return '3:2';
}

export function aspectRatio(aspect) {
  const [w, h] = String(aspect || '3:2').split(':').map(Number);
  return w > 0 && h > 0 ? w / h : 1.5;
}
