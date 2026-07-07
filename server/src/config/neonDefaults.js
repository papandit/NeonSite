// Default catalogue for the Neon Sign Studio. All money is INTEGER PAISE
// (INVARIANT 1). The admin can edit every row (NeonConfig); the public config
// endpoint serves only the active ones and quoteNeon prices from the live doc.

export const DEFAULT_NEON = {
  maxChars: 40,
  fonts: [
    { key: 'pacifico', name: 'Pacifico', cssFamily: "'Pacifico', cursive", script: true, active: true },
    { key: 'dancing', name: 'Dancing', cssFamily: "'Dancing Script', cursive", script: true, active: true },
    { key: 'kaushan', name: 'Kaushan', cssFamily: "'Kaushan Script', cursive", script: true, active: true },
    { key: 'monoton', name: 'Monoton', cssFamily: "'Monoton', cursive", script: false, active: true },
    { key: 'bungee', name: 'Bungee', cssFamily: "'Bungee', cursive", script: false, active: true },
    { key: 'audiowide', name: 'Audiowide', cssFamily: "'Audiowide', sans-serif", script: false, active: true },
  ],
  colors: [
    { key: 'pink', name: 'Pink', fill: '#ffc9e6', glow: '#ff2d95', active: true },
    { key: 'blue', name: 'Ice Blue', fill: '#c9f4ff', glow: '#18c8ff', active: true },
    { key: 'green', name: 'Mint', fill: '#ccffe6', glow: '#1cff9c', active: true },
    { key: 'warm', name: 'Warm White', fill: '#fff6e6', glow: '#ffcf8a', active: true },
    { key: 'purple', name: 'Purple', fill: '#e6d4ff', glow: '#a855ff', active: true },
    { key: 'red', name: 'Red', fill: '#ffd0d4', glow: '#ff2f45', active: true },
    { key: 'amber', name: 'Amber', fill: '#fff0cc', glow: '#ffb020', active: true },
    { key: 'cyan', name: 'Cool White', fill: '#eafcff', glow: '#7fe9ff', active: true },
  ],
  // cm = physical width; basePricePaise + per-character charge scale with size.
  sizes: [
    { key: 's', name: 'Small', cm: 40, basePricePaise: 180000, perCharPaise: 9000, fontSizePx: 34, active: true },
    { key: 'm', name: 'Medium', cm: 60, basePricePaise: 260000, perCharPaise: 13000, fontSizePx: 46, active: true },
    { key: 'l', name: 'Large', cm: 80, basePricePaise: 360000, perCharPaise: 18000, fontSizePx: 60, active: true },
    { key: 'xl', name: 'XL', cm: 100, basePricePaise: 480000, perCharPaise: 24000, fontSizePx: 76, active: true },
  ],
  backings: [
    { key: 'cut', name: 'Cut to shape', priceDeltaPaise: 0, active: true },
    { key: 'rect', name: 'Rectangle acrylic', priceDeltaPaise: 30000, active: true },
    { key: 'clear', name: 'Clear (invisible)', priceDeltaPaise: 50000, active: true },
  ],
  scenes: [
    { key: 'wall', name: 'Dark wall', active: true },
    { key: 'brick', name: 'Brick', active: true },
    { key: 'room', name: 'Bedroom', active: true },
  ],
};
