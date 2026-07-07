// Server-authoritative pricing for a neon sign (INVARIANT 2). Prices from the
// live NeonConfig — never from client input — and returns a canonical neon
// designDocument with option SNAPSHOTS (INVARIANT 5) so an order freezes the
// exact spec + prices at purchase time. Mirrors the studio math:
//   subtotal = size.basePrice + charCount * size.perChar + backing.delta
// where charCount ignores whitespace (matches the live preview estimate).

const activeOr = (list, key, fallbackFirst = true) => {
  const active = (list || []).filter((x) => x.active !== false);
  const found = active.find((x) => x.key === key);
  if (found) return found;
  return fallbackFirst ? active[0] : null;
};

export function neonCharCount(text = '') {
  return String(text).replace(/\s/g, '').length;
}

// Rough production tube length (metres) — script fonts use ~25% more tube.
export function neonTubeMeters(text, size, font) {
  const scriptBonus = font?.script ? 1.25 : 1;
  return neonCharCount(text) * ((size?.cm || 60) / 60) * 0.22 * scriptBonus;
}

/**
 * @param {object} config NeonConfig doc (plain or hydrated)
 * @param {object} spec   { text, font, color, size, backing, scene, previewImageUrl? }
 * @returns {{ errors: string[], designDocument: object }}
 */
export function quoteNeon(config, spec = {}) {
  const errors = [];
  const src = spec?.neon || spec || {};
  const text = typeof src.text === 'string' ? src.text : '';
  const maxChars = config.maxChars || 40;

  if (!text.trim()) errors.push('Sign text is required');
  if (text.length > maxChars) errors.push(`Text must be ${maxChars} characters or fewer`);

  const font = activeOr(config.fonts, src.font);
  const color = activeOr(config.colors, src.color);
  const size = activeOr(config.sizes, src.size);
  const backing = activeOr(config.backings, src.backing);
  const scene = activeOr(config.scenes, src.scene);

  if (!font) errors.push('No neon fonts are available');
  if (!color) errors.push('No neon colours are available');
  if (!size) errors.push('No neon sizes are available');

  let subtotalPaise = 0;
  const breakdown = [];
  const charCount = neonCharCount(text);

  if (size) {
    subtotalPaise += size.basePricePaise;
    breakdown.push({ label: `${size.name} base`, amountPaise: size.basePricePaise });
    const charsPaise = charCount * (size.perCharPaise || 0);
    if (charsPaise > 0) {
      subtotalPaise += charsPaise;
      breakdown.push({ label: `${charCount} characters`, amountPaise: charsPaise });
    }
  }
  if (backing && backing.priceDeltaPaise) {
    subtotalPaise += backing.priceDeltaPaise;
    breakdown.push({ label: backing.name, amountPaise: backing.priceDeltaPaise });
  }

  const snap = (o, keys) => (o ? Object.fromEntries(keys.map((k) => [k, o[k]])) : null);

  const designDocument = {
    schemaVersion: 1,
    kind: 'neon',
    neon: {
      text,
      charCount,
      font: snap(font, ['key', 'name', 'cssFamily', 'script']),
      color: snap(color, ['key', 'name', 'fill', 'glow']),
      size: snap(size, ['key', 'name', 'cm', 'fontSizePx', 'basePricePaise', 'perCharPaise']),
      backing: snap(backing, ['key', 'name', 'priceDeltaPaise']),
      scene: snap(scene, ['key', 'name']),
      tubeMeters: Math.round(neonTubeMeters(text, size, font) * 10) / 10,
    },
    render: { previewImageUrl: spec.previewImageUrl || spec?.render?.previewImageUrl || null },
    pricing: {
      currency: 'INR',
      authoritative: true,
      basePricePaise: size?.basePricePaise || 0,
      breakdown,
      subtotalPaise,
      computedAt: new Date().toISOString(),
    },
  };

  return { errors, designDocument };
}

export default quoteNeon;
