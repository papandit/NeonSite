// Completes two showcase Name Plate templates with real decorative FRAME artwork
// (generated SVG, embedded as data URIs — no hosting, never taints the canvas):
// a circular laurel-wreath frame and an ornate rectangular gold frame. Both have
// a transparent centre so the customer's text sits inside the frame and auto-fits.
//
//   Run:  node src/scripts/seedNameplateFrames.js   (from server/)

import { connectDB, disconnectDB } from '../db/connect.js';
import { NpCategory } from '../modules/nameplate/registry.js';
import slugify from '../utils/slugify.js';
import NpTemplate from '../modules/nameplate/models/NpTemplate.js';

const r = (rupees) => Math.round(rupees * 100);
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// ---- circular laurel-wreath frame (square) ----
function wreathFrame() {
  const S = 500, cx = 250, cy = 250;
  const leaves = [];
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * 360;
    const rad = (a * Math.PI) / 180;
    const rr = 224 + (i % 3 === 0 ? 6 : 0);
    const x = cx + rr * Math.cos(rad);
    const y = cy + rr * Math.sin(rad);
    const green = i % 2 ? '#5f8a44' : '#82ad61';
    const ry = 13 + (i % 4);
    leaves.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="${ry}" fill="${green}" transform="rotate(${(a + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" opacity="0.92"/>`);
  }
  const berries = [];
  for (const [bx, by] of [[250, 26], [232, 40], [268, 40]]) berries.push(`<circle cx="${bx}" cy="${by}" r="4.5" fill="#c8a04d"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c56e"/><stop offset="0.5" stop-color="#c8a04d"/><stop offset="1" stop-color="#a5802f"/></linearGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="234" fill="none" stroke="url(#gold)" stroke-width="9"/>
    <circle cx="${cx}" cy="${cy}" r="219" fill="none" stroke="#d9b866" stroke-width="2" opacity="0.7"/>
    ${leaves.join('')}${berries.join('')}
  </svg>`;
}

// ---- ornate rectangular gold frame ----
function royalFrame() {
  const W = 600, H = 300;
  const corner = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M0 34 C 0 12, 12 0, 34 0" fill="none" stroke="url(#gold)" stroke-width="6"/><circle cx="8" cy="8" r="4" fill="#c8a04d"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c56e"/><stop offset="0.5" stop-color="#c8a04d"/><stop offset="1" stop-color="#a5802f"/></linearGradient></defs>
    <rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="14" fill="none" stroke="url(#gold)" stroke-width="6"/>
    <rect x="30" y="30" width="${W - 60}" height="${H - 60}" rx="8" fill="none" stroke="#d9b866" stroke-width="1.5" opacity="0.8"/>
    ${corner(24, 24, 1, 1)}${corner(576, 24, -1, 1)}${corner(24, 276, 1, -1)}${corner(576, 276, -1, -1)}
    <path d="M270 34 q30 -14 60 0" fill="none" stroke="#c8a04d" stroke-width="3"/>
    <circle cx="300" cy="30" r="4" fill="#c8a04d"/>
  </svg>`;
}

const field = (over) => ({
  required: false, minLength: 0, maxLength: 40, defaultSizePx: 40, defaultColorHex: '#b08d3c',
  x: 0.5, y: 0.5, align: 'center', canMove: false, canResize: false, canRotate: false,
  canChangeColor: true, canChangeFont: true, canChangeSize: false, canBold: false, canItalic: false,
  status: 'active', ...over,
});

async function run() {
  await connectDB();
  const cat = async (name) => (await NpCategory.findOneAndUpdate({ name }, { $setOnInsert: { name, status: 'active' }, $set: { slug: slugify(name) } }, { new: true, upsert: true, setDefaultsOnInsert: true }))._id;
  const weddingCat = await cat('For Couples');
  const familyCat = await cat('Family of 3-4');

  const TEMPLATES = [
    {
      slug: 'seed-np-round-wreath', name: 'Round Wreath Family Plate', category: familyCat,
      svg: wreathFrame(), w: 400, h: 400,
      fields: [
        field({ key: 'name', label: 'Family name', required: true, defaultValue: 'The Sharma Family', x: 0.5, y: 0.46, defaultSizePx: 40 }),
        field({ key: 'house', label: 'House number', defaultValue: 'B-302', x: 0.5, y: 0.68, defaultSizePx: 26 }),
      ],
      layout: [{ type: 'element', x: 0.5, y: 0.22 }],
    },
    {
      slug: 'seed-np-royal-frame', name: 'Royal Gold Frame Plate', category: weddingCat,
      svg: royalFrame(), w: 600, h: 300,
      fields: [
        field({ key: 'name', label: 'Name', required: true, defaultValue: 'Aarav & Diya', x: 0.5, y: 0.42, defaultSizePx: 44 }),
        field({ key: 'subtitle', label: 'Subtitle', defaultValue: 'Welcome', x: 0.5, y: 0.66, defaultSizePx: 24 }),
      ],
      layout: [{ type: 'element', x: 0.5, y: 0.2 }],
    },
  ];

  for (const t of TEMPLATES) {
    const uri = dataUri(t.svg);
    await NpTemplate.findOneAndUpdate(
      { slug: t.slug },
      {
        name: t.name, slug: t.slug, category: t.category, status: 'active',
        basePlateImageUrl: uri, previewImageUrl: uri, transparentPngUrl: uri,
        widthMm: t.w, heightMm: t.h, basePricePaise: r(1799),
        textFields: t.fields, layout: t.layout,
      },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );
  }

  console.log('Frame templates completed:', TEMPLATES.map((t) => t.slug).join(', '));
  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
