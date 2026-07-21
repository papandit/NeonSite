// Seeds the Name Plate Studio with real, usable content: categories, fonts,
// colours, decorative elements, and 6 designed templates. Plate artwork is
// generated as crisp SVG embedded as data URIs (no external hosting needed, and
// data URIs never taint the Fabric canvas). Re-runnable: upserts supporting
// collections by name and replaces the seeded templates.
//
//   Run:  node src/scripts/seedNameplate.js   (from server/)

import { connectDB, disconnectDB } from '../db/connect.js';
import { NpCategory, NpFont, NpColor, NpElement } from '../modules/nameplate/registry.js';
import NpTemplate from '../modules/nameplate/models/NpTemplate.js';
import slugify from '../utils/slugify.js';

const r = (rupees) => Math.round(rupees * 100);
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// ---------- plate artwork (SVG) ----------
const woodGrain = (w, h) => Array.from({ length: 7 }, (_, i) => {
  const y = ((i + 1) / 8) * h;
  return `<path d="M0 ${y} C ${w * 0.25} ${y - 8}, ${w * 0.6} ${y + 8}, ${w} ${y}" stroke="#5b3a1c" stroke-width="1.4" fill="none" opacity="0.28"/>`;
}).join('');

const PLATES = {
  wood: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b07a45"/><stop offset="0.5" stop-color="#8a5a2b"/><stop offset="1" stop-color="#6d431f"/></linearGradient></defs>
    <rect width="${w}" height="${h}" rx="22" fill="url(#g)"/>${woodGrain(w, h)}
    <rect x="18" y="18" width="${w - 36}" height="${h - 36}" rx="14" fill="none" stroke="#f0d9ad" stroke-width="3" opacity="0.55"/></svg>`,

  acrylic: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4fafe"/><stop offset="1" stop-color="#dbe8f1"/></linearGradient></defs>
    <rect width="${w}" height="${h}" rx="20" fill="url(#a)"/>
    <rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="14" fill="#ffffff" opacity="0.35"/>
    <rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="14" fill="none" stroke="#b9cede" stroke-width="2"/>
    <rect x="0" y="0" width="${w}" height="${h * 0.4}" rx="20" fill="#ffffff" opacity="0.18"/></svg>`,

  marble: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f3ec"/><stop offset="1" stop-color="#e6ddcb"/></linearGradient></defs>
    <rect width="${w}" height="${h}" rx="18" fill="url(#m)"/>
    <path d="M0 ${h * 0.3} C ${w * 0.3} ${h * 0.2}, ${w * 0.6} ${h * 0.5}, ${w} ${h * 0.35}" stroke="#c9bda0" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M0 ${h * 0.7} C ${w * 0.4} ${h * 0.6}, ${w * 0.7} ${h * 0.85}, ${w} ${h * 0.72}" stroke="#d8cdb4" stroke-width="2" fill="none" opacity="0.5"/>
    <rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="12" fill="none" stroke="#c8a04d" stroke-width="4"/>
    <rect x="24" y="24" width="${w - 48}" height="${h - 48}" rx="8" fill="none" stroke="#c8a04d" stroke-width="1.5" opacity="0.7"/></svg>`,

  slate: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#333a44"/><stop offset="1" stop-color="#20252c"/></linearGradient></defs>
    <rect width="${w}" height="${h}" rx="14" fill="url(#s)"/>
    <rect x="${w * 0.5 - 60}" y="${h - 34}" width="120" height="4" rx="2" fill="#d4541f"/>
    <rect x="12" y="12" width="${w - 24}" height="${h - 24}" rx="10" fill="none" stroke="#4a525d" stroke-width="1.5"/></svg>`,

  led: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><radialGradient id="l" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#181a24"/><stop offset="1" stop-color="#0a0b10"/></radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <rect width="${w}" height="${h}" rx="20" fill="url(#l)"/>
    <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.32}" ry="${h * 0.22}" fill="#ff5ea8" opacity="0.14" filter="url(#glow)"/>
    <rect x="16" y="16" width="${w - 32}" height="${h - 32}" rx="14" fill="none" stroke="#3a2740" stroke-width="2"/></svg>`,

  steel: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dde1"/><stop offset="0.5" stop-color="#b7bcc2"/><stop offset="1" stop-color="#cdd2d7"/></linearGradient></defs>
    <rect width="${w}" height="${h}" rx="16" fill="url(#st)"/>
    ${Array.from({ length: 24 }, (_, i) => `<rect x="${(i / 24) * w}" y="0" width="1" height="${h}" fill="#ffffff" opacity="0.08"/>`).join('')}
    <rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="10" fill="none" stroke="#8a9199" stroke-width="2"/>
    <circle cx="30" cy="30" r="4" fill="#7d848b"/><circle cx="${w - 30}" cy="30" r="4" fill="#7d848b"/>
    <circle cx="30" cy="${h - 30}" r="4" fill="#7d848b"/><circle cx="${w - 30}" cy="${h - 30}" r="4" fill="#7d848b"/></svg>`,
};

// ---------- decorative elements (SVG) ----------
const ELEMENTS = {
  Flower: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g fill="#d4541f">${Array.from({ length: 6 }, (_, i) => `<ellipse cx="50" cy="26" rx="10" ry="22" transform="rotate(${i * 60} 50 50)"/>`).join('')}</g><circle cx="50" cy="50" r="10" fill="#f6b23d"/></svg>`,
  Leaf: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M50 8 C 80 30, 80 70, 50 92 C 20 70, 20 30, 50 8 Z" fill="#3f7d4f"/><path d="M50 12 L50 88" stroke="#2c5c39" stroke-width="3"/></svg>`,
  Star: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M50 6 L61 38 L95 38 L67 58 L78 90 L50 70 L22 90 L33 58 L5 38 L39 38 Z" fill="#f6b23d"/></svg>`,
  Heart: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M50 86 C 10 56, 12 20, 38 24 C 46 25, 50 34, 50 34 C 50 34, 54 25, 62 24 C 88 20, 90 56, 50 86 Z" fill="#e0556a"/></svg>`,
  Om: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50" y="72" font-size="72" text-anchor="middle" fill="#b5651d" font-family="serif">ॐ</text></svg>`,
  Paw: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g fill="#6d431f"><circle cx="30" cy="38" r="10"/><circle cx="50" cy="30" r="10"/><circle cx="70" cy="38" r="10"/><ellipse cx="50" cy="66" rx="20" ry="16"/></g></svg>`,
};

const field = (over) => ({
  required: false, minLength: 0, maxLength: 40, defaultSizePx: 40, defaultColorHex: '#1a1a1a',
  x: 0.5, y: 0.5, align: 'center', canMove: true, canResize: true, canChangeColor: true,
  canChangeFont: true, canChangeSize: true, canBold: true, canItalic: true, status: 'active', ...over,
});

async function run() {
  await connectDB();

  // Categories — the 15-strong name-plate collection (replaces the old set).
  await NpCategory.deleteMany({ name: { $in: ['Wooden Name Plates', 'Acrylic Name Plates', 'Villa Name Plates', 'Office Name Plates', 'LED Name Plates', 'Apartment Name Plates'] } });
  const catDefs = [
    'Metal Outdoor', 'Wooden', 'Acrylic', 'Resin', 'Modern', 'For Office',
    'With Pets', 'With Lights', 'For Desk', 'For Villas', 'Indian Languages',
    'For Couples', 'Family of 3-4', 'Religious Themes', 'Cute Caricature',
  ];
  const cats = {};
  for (let i = 0; i < catDefs.length; i++) {
    const name = catDefs[i];
    cats[name] = await NpCategory.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, status: 'active' }, $set: { sortOrder: i, slug: slugify(name) } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  // Fonts — the full catalogue (all families are preloaded in the customer app).
  const FONT_FAMILIES = [
    'Fraunces', 'Nunito', 'Pacifico', 'Dancing Script', 'Kaushan Script', 'Great Vibes',
    'Sacramento', 'Satisfy', 'Cookie', 'Allura', 'Parisienne', 'Yellowtail', 'Lobster',
    'Courgette', 'Caveat', 'Permanent Marker', 'Shadows Into Light', 'Neonderthaw',
    'Tilt Neon', 'Monoton', 'Bungee', 'Audiowide', 'Righteous', 'Orbitron', 'Bebas Neue',
    'Anton', 'Playfair Display', 'Cinzel', 'Cormorant Garamond', 'Abril Fatface',
    'Alfa Slab One', 'Lobster Two', 'Pattaya', 'Marck Script', 'Rock Salt', 'Amatic SC',
    'Tangerine', 'Pinyon Script', 'Alex Brush', 'Kalam', 'Damion', 'Rye',
    'Fredericka the Great', 'Bungee Shade', 'Poiret One', 'Sail',
  ];
  for (const family of FONT_FAMILIES) {
    await NpFont.findOneAndUpdate({ name: family }, { $setOnInsert: { name: family, status: 'active', meta: { family } } }, { upsert: true, setDefaultsOnInsert: true });
  }

  // Colours — a rich palette (admins can add more from the Colors page).
  const colorDefs = [
    ['Black', '#1a1a1a', 0], ['White', '#f8f8f8', 0], ['Ivory', '#fffff0', 0],
    ['Charcoal', '#2b2b2b', 0], ['Graphite', '#36393b', 0], ['Silver', '#c0c0c0', 0],
    ['Gold', '#c8a04d', 5000], ['Champagne', '#f0e6c8', 3000], ['Rose Gold', '#b76e79', 5000],
    ['Copper', '#b87333', 3000], ['Bronze', '#8c6a3f', 2000], ['Cocoa', '#3a2b1d', 0],
    ['Maroon', '#6d1a2e', 0], ['Burgundy', '#7b1e3b', 0], ['Ruby', '#9b1c31', 2000],
    ['Saffron', '#d4541f', 0], ['Coral', '#ff6b6b', 0], ['Amber', '#f59e0b', 0],
    ['Pink', '#ff5ea8', 3000], ['Lavender', '#8b7bd8', 0], ['Royal Blue', '#1e3a8a', 0],
    ['Navy', '#1b2a4a', 0], ['Sky Blue', '#38bdf8', 0], ['Teal', '#0e7490', 0],
    ['Emerald', '#047857', 0], ['Forest', '#14532d', 0], ['Mint', '#6ee7b7', 0],
    ['Slate', '#475569', 0],
    // Extended palette
    ['Matte Black', '#28282b', 0], ['Grey', '#808080', 0], ['Cream', '#fffdd0', 0],
    ['Beige', '#e8d9b5', 0], ['Sand', '#c2b280', 0], ['Brass', '#b5a642', 2000],
    ['Wine', '#722f37', 0], ['Crimson', '#dc143c', 0], ['Terracotta', '#cc4e3a', 0],
    ['Peach', '#ffcba4', 0], ['Mustard', '#e1ad01', 0], ['Olive', '#6b8e23', 0],
    ['Sage', '#9caf88', 0], ['Jade', '#00a86b', 0], ['Turquoise', '#30d5c8', 0],
    ['Steel Blue', '#4682b4', 0], ['Midnight', '#191970', 0], ['Indigo', '#4b0082', 0],
    ['Plum', '#8e4585', 0], ['Lilac', '#c8a2c8', 0],
  ];
  for (const [name, hex, price] of colorDefs) {
    await NpColor.findOneAndUpdate({ name }, { $setOnInsert: { name, status: 'active', priceDeltaPaise: price, meta: { hex } } }, { upsert: true, setDefaultsOnInsert: true });
  }

  // Elements
  for (const [name, svg] of Object.entries(ELEMENTS)) {
    const uri = dataUri(svg);
    await NpElement.findOneAndUpdate({ name }, { $setOnInsert: { name, status: 'active', priceDeltaPaise: 2000, imageUrl: uri, meta: { image: uri } } }, { upsert: true, setDefaultsOnInsert: true });
  }

  // Templates (wipe the seeded set, recreate)
  await NpTemplate.deleteMany({ slug: /^seed-np-/ });
  const TEMPLATES = [
    { key: 'wood', name: 'Classic Wooden Family Plate', cat: 'Wooden', w: 600, h: 300, price: 1299,
      fields: [field({ key: 'welcome', label: 'Welcome text', defaultValue: 'WELCOME', y: 0.24, defaultSizePx: 26, defaultColorHex: '#f0d9ad', defaultFontFamily: 'Bebas Neue' }),
               field({ key: 'family', label: 'Family name', required: true, defaultValue: 'The Sharma Family', y: 0.55, defaultSizePx: 46, defaultColorHex: '#3a2b1d', defaultFontFamily: 'Fraunces' })] },
    { key: 'acrylic', name: 'Modern Acrylic Nameplate', cat: 'Acrylic', w: 600, h: 300, price: 1499,
      fields: [field({ key: 'name', label: 'Name', required: true, defaultValue: 'AARAV MEHTA', y: 0.46, defaultSizePx: 48, defaultColorHex: '#1a2a38', defaultFontFamily: 'Bebas Neue' }),
               field({ key: 'subtitle', label: 'Subtitle', defaultValue: 'Architect', y: 0.68, defaultSizePx: 24, defaultColorHex: '#3a566b', defaultFontFamily: 'Nunito' })] },
    { key: 'villa', plate: 'marble', name: 'Luxury Villa Marble Plate', cat: 'For Villas', w: 600, h: 400, price: 2499,
      fields: [field({ key: 'villa', label: 'Villa name', required: true, defaultValue: 'Villa Serene', y: 0.44, defaultSizePx: 52, defaultColorHex: '#7c5a1e', defaultFontFamily: 'Great Vibes' }),
               field({ key: 'house', label: 'House number', defaultValue: 'No. 24', y: 0.66, defaultSizePx: 30, defaultColorHex: '#3a2b1d', defaultFontFamily: 'Fraunces' })] },
    { key: 'office', plate: 'slate', name: 'Minimal Office Desk Plate', cat: 'For Office', w: 600, h: 200, price: 1099,
      fields: [field({ key: 'name', label: 'Name', required: true, defaultValue: 'Dr. A. Verma', y: 0.42, defaultSizePx: 40, defaultColorHex: '#f4ece1', defaultFontFamily: 'Fraunces' }),
               field({ key: 'title', label: 'Designation', defaultValue: 'Cardiologist', y: 0.7, defaultSizePx: 22, defaultColorHex: '#d4541f', defaultFontFamily: 'Nunito' })] },
    { key: 'led', name: 'LED Neon Glow Nameplate', cat: 'With Lights', w: 600, h: 300, price: 2999,
      fields: [field({ key: 'name', label: 'Name', required: true, defaultValue: 'The Kapoors', y: 0.5, defaultSizePx: 54, defaultColorHex: '#ffc9e6', defaultFontFamily: 'Pacifico' })] },
    { key: 'steel', name: 'Brushed Steel Apartment Plate', cat: 'Modern', w: 520, h: 360, price: 1699,
      fields: [field({ key: 'flat', label: 'Flat number', required: true, defaultValue: 'B-302', y: 0.4, defaultSizePx: 60, defaultColorHex: '#20252c', defaultFontFamily: 'Bebas Neue' }),
               field({ key: 'family', label: 'Family name', defaultValue: 'Nair', y: 0.66, defaultSizePx: 30, defaultColorHex: '#3a3f45', defaultFontFamily: 'Fraunces' })] },
  ];

  for (const t of TEMPLATES) {
    const uri = dataUri(PLATES[t.plate || t.key](t.w, t.h));
    await NpTemplate.create({
      name: t.name, slug: `seed-np-${t.key}`, category: cats[t.cat]._id, status: 'active',
      basePlateImageUrl: uri, previewImageUrl: uri, widthMm: t.w, heightMm: t.h,
      basePricePaise: r(t.price), textFields: t.fields,
    });
  }

  const [catN, fontN, colN, elN, tplN] = await Promise.all([
    NpCategory.countDocuments(), NpFont.countDocuments(), NpColor.countDocuments(), NpElement.countDocuments(), NpTemplate.countDocuments(),
  ]);
  console.log(`Name Plate seed complete: categories ${catN}, fonts ${fontN}, colors ${colN}, elements ${elN}, templates ${tplN}`);
  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
