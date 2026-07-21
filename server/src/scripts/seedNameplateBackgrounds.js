// Sample name-plate BACKGROUNDS grouped into sections, so the "photo name plate"
// flow (customer picks a backdrop, their text sits on it) is demonstrable out of
// the box. Replace these with real artwork from the admin whenever you like.
//
//   Run:  node src/scripts/seedNameplateBackgrounds.js   (from server/)

import { connectDB, disconnectDB } from '../db/connect.js';
import { NpBackground } from '../modules/nameplate/registry.js';

const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const W = 600;
const H = 300;

// A soft two-tone backdrop with an optional decorative motif.
const plate = (from, to, motif = '') => dataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" rx="24" fill="url(#g)"/>
    ${motif}
    <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="16" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.45"/>
  </svg>`,
);

const leaves = Array.from({ length: 14 }, (_, i) => {
  const x = 30 + i * 40;
  return `<ellipse cx="${x}" cy="${i % 2 ? 44 : H - 44}" rx="16" ry="7" fill="#4b7f52" opacity="0.5" transform="rotate(${i % 2 ? 18 : -18} ${x} ${i % 2 ? 44 : H - 44})"/>`;
}).join('');

const dots = Array.from({ length: 22 }, (_, i) =>
  `<circle cx="${24 + (i * 27) % (W - 48)}" cy="${28 + ((i * 53) % (H - 56))}" r="3" fill="#ffffff" opacity="0.35"/>`).join('');

const arch = `<path d="M${W / 2 - 110} ${H - 40} v-90 a110 110 0 0 1 220 0 v90z" fill="#ffffff" opacity="0.18"/>`;

const BACKGROUNDS = [
  ['Individuals & Couples', [
    ['Blush Portrait', plate('#f7d9d3', '#e9b6ad', arch)],
    ['Sky Portrait', plate('#d6e6f5', '#a9c8e6', arch)],
    ['Sunset Portrait', plate('#fdd9a0', '#f0a679', arch)],
  ]],
  ['Floral & Nature', [
    ['Green Wreath', plate('#f3f7ee', '#dbe9d2', leaves)],
    ['Ivory Botanical', plate('#fbf7ef', '#eee3cf', leaves)],
  ]],
  ['Textures', [
    ['Marble Cream', plate('#f7f3ec', '#e6ddcb', dots)],
    ['Slate Night', plate('#39424e', '#20252c', dots)],
  ]],
];

async function run() {
  await connectDB();
  let n = 0;
  for (const [group, items] of BACKGROUNDS) {
    for (const [name, uri] of items) {
      await NpBackground.findOneAndUpdate(
        { name },
        { $set: { name, status: 'active', priceDeltaPaise: 0, imageUrl: uri, meta: { group, image: uri, type: 'texture' } } },
        { upsert: true, setDefaultsOnInsert: true },
      );
      n += 1;
    }
  }
  console.log(`✅ Seeded ${n} backgrounds across ${BACKGROUNDS.length} sections.`);
  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
