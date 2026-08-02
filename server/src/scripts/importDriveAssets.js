// Imports the drive-download neon artwork into MongoDB as Assets, so every
// storefront image is served from our own DB (GET /api/assets/:id) instead of
// the filesystem or an external placeholder host.
//
// The source PNGs are 1400x2000 and ~3MB each — far too heavy for a product
// grid. Each one is downscaled to fit MAX_EDGE and re-encoded as JPEG, which
// takes them to roughly 100-150KB (~25x smaller) with no visible loss. The
// sources are fully opaque, so dropping the alpha channel is safe.
//
// Files are matched by the name before the " - Off/On/Thumb" suffix, so the
// three folders line up into one product each:
//
//   "Apple - Off.png"  -> lightOffImageUrl
//   "Apple- On.png"    -> lightOnImageUrl
//   "Apple - Thumb.jpg"-> only used when a design has no On/Off artwork; the
//                         catalogue thumbs are ~180px, too soft for a card.
//
//   Preview (read-only):  node src/scripts/importDriveAssets.js
//   Apply:                node src/scripts/importDriveAssets.js --write
//
// Re-running is safe: an asset already imported from the same file (matched on
// filename + folder) is reused rather than duplicated.

import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from 'canvas';
import { connectDB, disconnectDB } from '../db/connect.js';
import Asset from '../models/Asset.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Settings from '../models/Settings.js';

const WRITE = process.argv.includes('--write');
const ROOT = path.resolve(process.cwd(), '..');

// Long edge in pixels. 1200 covers a full-width phone at 2x and the largest
// slot the product page ever renders.
const MAX_EDGE = 1200;
const QUALITY = 0.82;
// Thumbnails only ever render in a card, so they can be much smaller.
const THUMB_EDGE = 700;

const SETS = [
  { dir: 'drive-download-20260728T083003Z-1-001', role: 'off' },
  { dir: 'drive-download-20260728T083045Z-1-001', role: 'on' },
  { dir: 'drive-download-20260728T083102Z-1-001', role: 'thumb' },
];

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

// "Better Together - Thumb.jpg" / "Apple- On.png" -> "Better Together"
function baseName(file) {
  return file
    .replace(IMAGE_RE, '')
    .replace(/\s*-?\s*(off|on|thumbs?|thumb)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function encode(file, maxEdge) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  // JPEG has no alpha; paint the transparent areas white rather than black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return { data: canvas.toBuffer('image/jpeg', { quality: QUALITY }), w, h };
}

// Import one file, reusing an asset already imported from it.
async function importFile(file, folder, maxEdge, stats) {
  const filename = path.basename(file);
  const existing = await Asset.findOne({ filename, folder }, { _id: 1 }).lean();
  if (existing) {
    stats.reused += 1;
    return `/api/assets/${existing._id}`;
  }

  const srcBytes = fs.statSync(file).size;
  const { data, w, h } = await encode(file, maxEdge);
  stats.srcBytes += srcBytes;
  stats.outBytes += data.length;
  stats.imported += 1;
  console.log(
    `   ${filename}  ${Math.round(srcBytes / 1024)}KB -> ${Math.round(data.length / 1024)}KB  (${w}x${h})`,
  );
  if (!WRITE) return '/api/assets/<new>';

  const doc = await Asset.create({
    data,
    contentType: 'image/jpeg',
    filename,
    kind: 'image',
    folder,
    bytes: data.length,
  });
  return `/api/assets/${doc._id}`;
}

async function neonCategoryId() {
  const existing = await Category.findOne({ slug: 'neon-sign' }, { _id: 1 }).lean();
  if (existing) return existing._id;
  if (!WRITE) return null;
  const doc = await Category.create({ name: 'Neon Sign', slug: 'neon-sign', isActive: true });
  return doc._id;
}

async function run() {
  await connectDB();
  const stats = { imported: 0, reused: 0, srcBytes: 0, outBytes: 0 };

  // 1. Group every source file by product name.
  const byName = new Map();
  for (const set of SETS) {
    const dir = path.join(ROOT, set.dir);
    if (!fs.existsSync(dir)) {
      console.log(`!  missing folder, skipped: ${set.dir}`);
      continue;
    }
    for (const file of fs.readdirSync(dir)) {
      if (!IMAGE_RE.test(file)) continue;
      const name = baseName(file);
      if (!name) continue;
      if (!byName.has(name)) byName.set(name, {});
      byName.get(name)[set.role] = path.join(dir, file);
    }
  }
  console.log(`Found ${byName.size} neon designs across ${SETS.length} folders.\n`);

  // 2. Import each design's artwork and upsert its product.
  const categoryId = await neonCategoryId();
  let productsTouched = 0;

  for (const [name, files] of [...byName].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`${name}`);
    const off = files.off ? await importFile(files.off, 'neon', MAX_EDGE, stats) : '';
    const on = files.on ? await importFile(files.on, 'neon', MAX_EDGE, stats) : '';
    // Fall back to the catalogue thumb only when there's no full-size artwork.
    const thumb = (!on && !off && files.thumb)
      ? await importFile(files.thumb, 'neon-thumb', THUMB_EDGE, stats)
      : '';

    if (!WRITE) { productsTouched += 1; continue; }

    const slug = slugify(name);
    const images = [on, off, thumb].filter(Boolean);
    const existing = await Product.findOne({ slug });
    if (existing) {
      existing.images = images;
      existing.lightOnImageUrl = on || existing.lightOnImageUrl;
      existing.lightOffImageUrl = off || existing.lightOffImageUrl;
      existing.isNeon = true;
      await existing.save();
    } else {
      await Product.create({
        name,
        slug,
        description: `${name} LED neon sign, handmade on clear acrylic.`,
        category: categoryId,
        basePricePaise: 360000,
        compareAtPricePaise: 400000,
        images,
        lightOnImageUrl: on,
        lightOffImageUrl: off,
        isNeon: true,
        isActive: true,
      });
    }
    productsTouched += 1;
  }

  // 3. Move the bundled crafted / highlight placeholders into the DB too, and
  //    point Site content at the asset URLs instead of /public paths.
  const publicSets = [
    { dir: '../client-customer/public/crafted', folder: 'crafted' },
    { dir: '../client-customer/public/highlights', folder: 'highlights' },
  ];
  const uploaded = {};
  for (const set of publicSets) {
    const dir = path.resolve(process.cwd(), set.dir);
    if (!fs.existsSync(dir)) continue;
    console.log(`\n${set.folder}/`);
    uploaded[set.folder] = [];
    for (const file of fs.readdirSync(dir).filter((f) => IMAGE_RE.test(f)).sort()) {
      uploaded[set.folder].push(await importFile(path.join(dir, file), set.folder, THUMB_EDGE, stats));
    }
  }

  if (WRITE && (uploaded.crafted?.length || uploaded.highlights?.length)) {
    const settings = (await Settings.findOne()) || new Settings();
    const content = { ...(settings.content || {}) };
    if (uploaded.crafted?.length) {
      content.crafted = { ...(content.crafted || {}), images: uploaded.crafted };
    }
    if (uploaded.highlights?.length) {
      const labels = ['Meet FloRo', 'Features', 'Reviews', 'Influencers', 'BTS'];
      const links = ['/neon', '/neon', '', '', ''];
      content.highlights = uploaded.highlights.map((image, i) => ({
        label: labels[i] || `Story ${i + 1}`,
        image,
        link: links[i] || '',
      }));
    }
    settings.content = content;
    settings.markModified('content');
    await settings.save();
    console.log('\nSite content now points at DB assets.');
  }

  const saved = stats.srcBytes - stats.outBytes;
  console.log(`\n${'-'.repeat(56)}`);
  console.log(`designs:   ${byName.size}   products ${WRITE ? 'written' : 'to write'}: ${productsTouched}`);
  console.log(`assets:    ${stats.imported} imported, ${stats.reused} already present`);
  console.log(
    `size:      ${(stats.srcBytes / 1048576).toFixed(1)}MB -> ${(stats.outBytes / 1048576).toFixed(1)}MB` +
    (stats.srcBytes ? `  (${Math.round((saved / stats.srcBytes) * 100)}% smaller)` : ''),
  );
  if (!WRITE) console.log('\nDry run — nothing written. Re-run with --write to apply.');

  await disconnectDB();
}

run().catch(async (e) => {
  console.error(e);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
