// Imports ready-made NEON SIGN products from the Daxon CSV + the three Drive
// image folders (thumbnail / light-on / light-off). Idempotent: products are
// upserted by slug, so re-running refreshes them instead of duplicating.
//
//   Run (from server/):
//     node src/scripts/importNeonProducts.js
//
//   Optional env:
//     NEON_CSV=<path to csv>            NEON_OFF_DIR / NEON_ON_DIR / NEON_THUMB_DIR
//     BASE_URL=https://api.example.com  (used to build /api/assets/:id URLs)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../db/connect.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { persistAsset } from '../services/assets/assetStore.js';
import slugify from '../utils/slugify.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CSV = process.env.NEON_CSV || path.join(REPO, 'Daxon Neon Products List.xlsx - NEON SIGNS.csv');
const DIRS = {
  off: process.env.NEON_OFF_DIR || path.join(REPO, 'drive-download-20260728T083003Z-1-001'),
  on: process.env.NEON_ON_DIR || path.join(REPO, 'drive-download-20260728T083045Z-1-001'),
  thumb: process.env.NEON_THUMB_DIR || path.join(REPO, 'drive-download-20260728T083102Z-1-001'),
};
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const rupeesToPaise = (v) => Math.round(Number(String(v).replace(/[^\d.]/g, '') || 0) * 100);

// Minimal CSV reader (the export has no embedded newlines; quotes are handled).
function parseCsv(text) {
  const rows = [];
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells.map((c) => c.trim()));
  }
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// "Apple - Off.png" / "Yo -On.png" / "Baloons - Thumbs.jpg" -> "apple" / "yo" / "baloons"
const keyOf = (s) => String(s)
  .replace(/\.(png|jpe?g|webp)$/i, '')
  .replace(/\s*[-_]\s*(off|on|thumbs?|thumbnail)\s*$/i, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

async function indexDir(dir) {
  const map = {};
  let files = [];
  try { files = await fs.readdir(dir); } catch { return map; }
  for (const f of files) {
    if (!MIME[path.extname(f).toLowerCase()]) continue; // skip Thumbs.db etc.
    const k = keyOf(f);
    if (!map[k]) map[k] = path.join(dir, f);
  }
  return map;
}

async function upload(file) {
  if (!file) return '';
  const buffer = await fs.readFile(file);
  const res = await persistAsset(buffer, {
    kind: 'image',
    folder: 'neon-products',
    contentType: MIME[path.extname(file).toLowerCase()] || 'image/png',
    filename: path.basename(file),
  });
  return res.url;
}

async function run() {
  await connectDB();

  const rows = parseCsv(await fs.readFile(CSV, 'utf8')).filter((r) => (r.Name || '').trim());
  const [offs, ons, thumbs] = await Promise.all([indexDir(DIRS.off), indexDir(DIRS.on), indexDir(DIRS.thumb)]);
  console.log(`CSV rows: ${rows.length} · images off/on/thumb: ${Object.keys(offs).length}/${Object.keys(ons).length}/${Object.keys(thumbs).length}`);

  // One category for the whole set (matches the CSV "Category" column).
  const catName = rows[0]?.Category?.trim() || 'Neon Sign';
  const category = await Category.findOneAndUpdate(
    { slug: slugify(catName) },
    { $setOnInsert: { name: catName, slug: slugify(catName), status: 'active' } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const cache = new Map();
  const put = async (file) => {
    if (!file) return '';
    if (!cache.has(file)) cache.set(file, await upload(file));
    return cache.get(file);
  };

  let created = 0;
  let updated = 0;
  let noImages = 0;

  for (const r of rows) {
    const name = r.Name.trim();
    const k = keyOf(name);
    const [thumb, on, off] = [await put(thumbs[k]), await put(ons[k]), await put(offs[k])];
    if (!thumb && !on && !off) noImages += 1;

    const sale = rupeesToPaise(r['Sale Price']);
    const discount = rupeesToPaise(r['Discount Price']);
    // Sell at the discounted price; show the sale price struck through when higher.
    const sellPaise = discount > 0 ? discount : sale;
    const comparePaise = discount > 0 && sale > discount ? sale : 0;

    const slug = slugify(name);
    const images = [thumb, on, off].filter(Boolean);
    const doc = {
      name,
      slug,
      category: category._id,
      description: r.Description || '',
      status: 'active',
      kind: 'plate',
      isNeon: true,
      images,
      lightOnImageUrl: on,
      lightOffImageUrl: off,
      sizeText: r.Size || '',
      sizeUnits: r['Size Units'] || '',
      colorText: r.Color || '',
      dimensions: [r.Size, r['Size Units']].filter(Boolean).join(' '),
      basePricePaise: sellPaise,
      compareAtPricePaise: comparePaise,
    };

    const existing = await Product.findOne({ slug }).select('_id').lean();
    await Product.findOneAndUpdate({ slug }, { $set: doc }, { new: true, upsert: true, setDefaultsOnInsert: true });
    if (existing) updated += 1; else created += 1;
    console.log(`  ${existing ? 'updated' : 'created'}  ${name}  ₹${(sellPaise / 100).toFixed(2)}${comparePaise ? ` (was ₹${(comparePaise / 100).toFixed(2)})` : ''}  imgs:${images.length}`);
  }

  console.log(`\n✅ Neon products — created ${created}, updated ${updated}, without images ${noImages}. Category: ${category.name}`);
  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
