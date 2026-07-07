// Default catalogue for the Neon Sign Studio. All money is INTEGER PAISE
// (INVARIANT 1). The admin can edit every row (NeonConfig); the public config
// endpoint serves only the active ones and quoteNeon prices from the live doc.

// A curated library of popular neon-friendly display & script fonts (Google
// Fonts). Loaded in the customer index.html; the admin can one-click merge the
// whole set into the live catalogue. script=true fonts use ~25% more tube.
export const NEON_FONT_LIBRARY = [
  { key: 'pacifico', name: 'Pacifico', cssFamily: "'Pacifico', cursive", script: true },
  { key: 'dancing', name: 'Dancing', cssFamily: "'Dancing Script', cursive", script: true },
  { key: 'kaushan', name: 'Kaushan', cssFamily: "'Kaushan Script', cursive", script: true },
  { key: 'greatvibes', name: 'Great Vibes', cssFamily: "'Great Vibes', cursive", script: true },
  { key: 'sacramento', name: 'Sacramento', cssFamily: "'Sacramento', cursive", script: true },
  { key: 'satisfy', name: 'Satisfy', cssFamily: "'Satisfy', cursive", script: true },
  { key: 'cookie', name: 'Cookie', cssFamily: "'Cookie', cursive", script: true },
  { key: 'allura', name: 'Allura', cssFamily: "'Allura', cursive", script: true },
  { key: 'parisienne', name: 'Parisienne', cssFamily: "'Parisienne', cursive", script: true },
  { key: 'yellowtail', name: 'Yellowtail', cssFamily: "'Yellowtail', cursive", script: true },
  { key: 'lobster', name: 'Lobster', cssFamily: "'Lobster', cursive", script: true },
  { key: 'courgette', name: 'Courgette', cssFamily: "'Courgette', cursive", script: true },
  { key: 'caveat', name: 'Caveat', cssFamily: "'Caveat', cursive", script: true },
  { key: 'marker', name: 'Marker', cssFamily: "'Permanent Marker', cursive", script: true },
  { key: 'shadows', name: 'Handwritten', cssFamily: "'Shadows Into Light', cursive", script: true },
  { key: 'neonderthaw', name: 'Neonderthaw', cssFamily: "'Neonderthaw', cursive", script: true },
  { key: 'tiltneon', name: 'Tilt Neon', cssFamily: "'Tilt Neon', sans-serif", script: false },
  { key: 'monoton', name: 'Monoton', cssFamily: "'Monoton', cursive", script: false },
  { key: 'bungee', name: 'Bungee', cssFamily: "'Bungee', cursive", script: false },
  { key: 'audiowide', name: 'Audiowide', cssFamily: "'Audiowide', sans-serif", script: false },
  { key: 'righteous', name: 'Righteous', cssFamily: "'Righteous', sans-serif", script: false },
  { key: 'orbitron', name: 'Orbitron', cssFamily: "'Orbitron', sans-serif", script: false },
  { key: 'bebas', name: 'Bebas Neue', cssFamily: "'Bebas Neue', sans-serif", script: false },
  { key: 'anton', name: 'Anton', cssFamily: "'Anton', sans-serif", script: false },
];

export const DEFAULT_NEON = {
  maxChars: 40,
  fonts: NEON_FONT_LIBRARY.map((f) => ({ ...f, active: true })),
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
    { key: 'xs', name: 'Mini', cm: 30, basePricePaise: 140000, perCharPaise: 7000, fontSizePx: 28, active: true },
    { key: 's', name: 'Small', cm: 40, basePricePaise: 180000, perCharPaise: 9000, fontSizePx: 34, active: true },
    { key: 'm', name: 'Medium', cm: 60, basePricePaise: 260000, perCharPaise: 13000, fontSizePx: 46, active: true },
    { key: 'l', name: 'Large', cm: 80, basePricePaise: 360000, perCharPaise: 18000, fontSizePx: 60, active: true },
    { key: 'xl', name: 'XL', cm: 100, basePricePaise: 480000, perCharPaise: 24000, fontSizePx: 76, active: true },
    { key: 'xxl', name: 'Jumbo', cm: 120, basePricePaise: 600000, perCharPaise: 30000, fontSizePx: 92, active: true },
  ],
  backings: [
    { key: 'cut', name: 'Cut to shape', priceDeltaPaise: 0, active: true },
    { key: 'rect', name: 'Rectangle acrylic', priceDeltaPaise: 30000, active: true },
    { key: 'clear', name: 'Clear (invisible)', priceDeltaPaise: 50000, active: true },
  ],
  // Power plug/adapter the sign ships with — the top 5 regional plug types.
  adapters: [
    { key: 'india', name: 'India (Type D/M)', priceDeltaPaise: 0, active: true },
    { key: 'us', name: 'US / Canada (Type A/B)', priceDeltaPaise: 0, active: true },
    { key: 'eu', name: 'Europe (Type C/F)', priceDeltaPaise: 0, active: true },
    { key: 'uk', name: 'UK (Type G)', priceDeltaPaise: 0, active: true },
    { key: 'au', name: 'Australia / NZ (Type I)', priceDeltaPaise: 0, active: true },
  ],
  // imageUrl optional — when set (admin upload), it's shown behind the sign;
  // otherwise the key maps to a built-in CSS backdrop.
  scenes: [
    { key: 'wall', name: 'Dark wall', imageUrl: '', active: true },
    { key: 'brick', name: 'Brick', imageUrl: '', active: true },
    { key: 'room', name: 'Bedroom', imageUrl: '', active: true },
    { key: 'cafe', name: 'Café', imageUrl: '', active: true },
    { key: 'studio', name: 'Studio', imageUrl: '', active: true },
    { key: 'bar', name: 'Bar / lounge', imageUrl: '', active: true },
    { key: 'garden', name: 'Garden wall', imageUrl: '', active: true },
    { key: 'sky', name: 'Night sky', imageUrl: '', active: true },
    { key: 'gallery', name: 'Gallery', imageUrl: '', active: true },
  ],
};
