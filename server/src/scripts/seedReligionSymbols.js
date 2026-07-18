// Seeds a set of RECOLOURABLE religion symbols into the Name Plate Studio
// "Elements" collection, grouped by religion (meta.group = the section).
// Each symbol is a clean monochrome line-art SVG that uses `currentColor`, so the
// storefront can tint it to any colour the customer picks.
//
//   Run:  node src/scripts/seedReligionSymbols.js   (from server/)

import { connectDB, disconnectDB } from '../db/connect.js';
import { NpElement } from '../modules/nameplate/registry.js';

// Wrap an inner SVG body in a 100×100 currentColor line-art frame.
const wrap = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

// A data URI of the SVG tinted to `hex` (currentColor resolves from the root color).
const colorize = (raw, hex) =>
  `data:image/svg+xml,${encodeURIComponent(raw.replace('<svg', `<svg style="color:${hex}"`))}`;

// 8 evenly-spaced spokes for the dharma wheel.
const spokes = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  const x1 = 50 + Math.cos(a) * 8, y1 = 50 + Math.sin(a) * 8;
  const x2 = 50 + Math.cos(a) * 36, y2 = 50 + Math.sin(a) * 36;
  return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
}).join('');

// [ religion, [ [name, svgBody], ... ] ]
const SYMBOLS = {
  Christianity: [
    ['Latin Cross', '<path d="M50 12 V88 M28 36 H72"/>'],
    ['Celtic Cross', '<path d="M50 12 V88 M24 46 H76"/><circle cx="50" cy="46" r="18"/>'],
  ],
  Islam: [
    ['Star & Crescent', '<path d="M64 20a30 30 0 1 0 0 60 24 24 0 1 1 0-60z" fill="currentColor" stroke="none"/><path d="M80 42l3.5 8.6 9.3.7-7 6.1 2.1 9.1-7.9-4.9-7.9 4.9 2.1-9.1-7-6.1 9.3-.7z" fill="currentColor" stroke="none"/>'],
    ['Crescent Moon', '<path d="M62 16a34 34 0 1 0 0 68 28 28 0 1 1 0-68z" fill="currentColor" stroke="none"/>'],
  ],
  Hinduism: [
    ['Om', '<text x="50" y="76" font-size="74" text-anchor="middle" fill="currentColor" stroke="none" font-family="Georgia, serif">ॐ</text>'],
    ['Swastika', '<path d="M50 16 V84 M16 50 H84 M50 16 H72 M84 50 V72 M50 84 H28 M16 50 V28"/>'],
  ],
  Sikhism: [
    ['Khanda', '<circle cx="50" cy="54" r="18"/><path d="M50 8 V76 M44 22 L50 14 L56 22"/><path d="M30 36 a34 34 0 0 0 2 40 M70 36 a34 34 0 0 1 -2 40"/>'],
    ['Ik Onkar', '<text x="50" y="72" font-size="52" text-anchor="middle" fill="currentColor" stroke="none" font-family="serif">ੴ</text>'],
  ],
  Buddhism: [
    ['Dharma Wheel', `<circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="7"/>${spokes}`],
    ['Lotus', '<path d="M50 80 C41 68 41 50 50 36 C59 50 59 68 50 80Z"/><path d="M50 80 C34 72 26 56 30 44 C44 50 50 64 50 80Z"/><path d="M50 80 C66 72 74 56 70 44 C56 50 50 64 50 80Z"/>'],
  ],
  Judaism: [
    ['Star of David', '<path d="M50 14 L79 64 H21 Z"/><path d="M50 86 L21 36 H79 Z"/>'],
    ['Menorah', '<path d="M50 34 V74 M34 82 H66 M50 74 V82"/><path d="M32 44 V60 M68 44 V60 M40 40 V60 M60 40 V60"/><path d="M32 44 A18 18 0 0 1 68 44 M40 40 A10 10 0 0 1 60 40"/>'],
  ],
  Jainism: [
    ['Ahimsa Hand', '<path d="M34 86 V50 a6 6 0 0 1 12 0 V44 a6 6 0 0 1 12 0 V48 a6 6 0 0 1 12 0 V64 c0 12 -8 22 -22 22 Z"/><circle cx="52" cy="60" r="8"/>'],
  ],
  Taoism: [
    ['Yin Yang', '<circle cx="50" cy="50" r="38"/><path d="M50 12 a19 19 0 0 1 0 38 19 19 0 0 0 0 38 38 38 0 0 1 0 -76z" fill="currentColor" stroke="none"/><circle cx="50" cy="31" r="5"/><circle cx="50" cy="69" r="5" fill="currentColor" stroke="none"/>'],
  ],
};

async function run() {
  await connectDB();
  let n = 0;
  for (const [group, list] of Object.entries(SYMBOLS)) {
    for (const [name, body] of list) {
      const raw = wrap(body);
      const uri = colorize(raw, '#3a3a3a'); // default thumbnail tint
      await NpElement.findOneAndUpdate(
        { name },
        { $set: { name, status: 'active', priceDeltaPaise: 0, imageUrl: uri, meta: { group, svg: uri, svgRaw: raw, recolor: true } } },
        { upsert: true, setDefaultsOnInsert: true },
      );
      n += 1;
    }
  }
  console.log(`✅ Seeded ${n} recolourable religion symbols across ${Object.keys(SYMBOLS).length} sections.`);
  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
