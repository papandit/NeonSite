// Recompresses oversized images already stored in the Asset collection, IN
// PLACE. Product artwork uploaded straight from a design tool arrives as
// 1400x2000 PNGs of 1.5-3.5MB each; a product grid pulling a dozen of those is
// why the storefront feels slow. Downscaling to MAX_EDGE and re-encoding takes
// them to ~100KB with no visible loss.
//
// Asset _ids are never changed, so every URL already stored on a product,
// order, template or settings document keeps working — there is nothing to
// re-link afterwards.
//
// Images that actually use transparency stay PNG (resized only); opaque ones
// become JPEG. SVGs, fonts and anything already small are left alone, and a
// re-encode that fails to save at least MIN_GAIN is discarded, so re-running
// converges instead of degrading quality a little more each pass.
//
//   Preview (read-only):  node src/scripts/optimizeAssets.js
//   Apply:                node src/scripts/optimizeAssets.js --write
//
// Both forms accept --limit=<n> to work through a subset, and read the target
// from MONGO_URI when you need a database other than the configured one:
//
//   MONGO_URI="mongodb://…/neonsite?authSource=admin" node src/scripts/optimizeAssets.js

import mongoose from 'mongoose';
import { createCanvas, loadImage } from 'canvas';
import { connectDB, disconnectDB } from '../db/connect.js';
import Asset from '../models/Asset.js';

const WRITE = process.argv.includes('--write');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0;

const MAX_EDGE = 1200;      // long edge; covers a full-width phone at 2x
const QUALITY = 0.82;
const MIN_BYTES = 250 * 1024; // leave anything already this small alone
const MIN_GAIN = 0.15;        // keep the re-encode only if it saves 15%+

const kb = (n) => `${Math.round(n / 1024)}KB`;
const mb = (n) => `${(n / 1048576).toFixed(1)}MB`;

// Sample the alpha channel — a fully opaque image can safely become JPEG.
function hasTransparency(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 4 * 37) {
    if (data[i] < 250) return true;
  }
  return false;
}

async function recompress(buffer, contentType) {
  const img = await loadImage(buffer);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  // Measure alpha at full size first — downscaling blends edges and would
  // report translucency on an image that had none.
  const probe = createCanvas(img.width, img.height);
  const probeCtx = probe.getContext('2d');
  probeCtx.drawImage(img, 0, 0);
  const alpha = /png|webp/i.test(contentType) && hasTransparency(probeCtx, img.width, img.height);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!alpha) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);

  return alpha
    ? { data: canvas.toBuffer('image/png'), contentType: 'image/png', w, h, alpha }
    : { data: canvas.toBuffer('image/jpeg', { quality: QUALITY }), contentType: 'image/jpeg', w, h, alpha };
}

async function run() {
  await connectDB();
  console.log(`database: ${mongoose.connection.db.databaseName}   mode: ${WRITE ? 'WRITE' : 'dry run'}\n`);

  const query = { kind: 'image', contentType: { $ne: 'image/svg+xml' }, bytes: { $gt: MIN_BYTES } };
  const total = await Asset.countDocuments(query);
  const cursor = Asset.find(query, { data: 1, contentType: 1, filename: 1, bytes: 1 })
    .sort({ bytes: -1 })
    .limit(LIMIT || 0)
    .cursor();

  const stats = { seen: 0, changed: 0, skipped: 0, failed: 0, before: 0, after: 0 };

  for await (const doc of cursor) {
    stats.seen += 1;
    const before = doc.data?.length || doc.bytes || 0;
    let out;
    try {
      out = await recompress(doc.data, doc.contentType);
    } catch (e) {
      stats.failed += 1;
      console.log(`  !  ${doc.filename || doc._id}: ${e.message}`);
      continue;
    }

    const gain = before ? (before - out.data.length) / before : 0;
    if (gain < MIN_GAIN) {
      stats.skipped += 1;
      continue;
    }

    stats.changed += 1;
    stats.before += before;
    stats.after += out.data.length;
    console.log(
      `  ${kb(before)} -> ${kb(out.data.length)}  ${out.w}x${out.h} ${out.alpha ? 'png (alpha)' : 'jpeg'}  ${doc.filename || doc._id}`,
    );

    if (WRITE) {
      await Asset.updateOne(
        { _id: doc._id },
        { $set: { data: out.data, contentType: out.contentType, bytes: out.data.length } },
      );
    }
  }

  const saved = stats.before - stats.after;
  console.log(`\n${'-'.repeat(56)}`);
  console.log(`candidates over ${kb(MIN_BYTES)}: ${total}${LIMIT ? ` (limited to ${LIMIT})` : ''}`);
  console.log(`recompressed ${stats.changed}, already efficient ${stats.skipped}, failed ${stats.failed}`);
  console.log(
    `size: ${mb(stats.before)} -> ${mb(stats.after)}` +
    (stats.before ? `   saves ${mb(saved)} (${Math.round((saved / stats.before) * 100)}%)` : ''),
  );
  if (!WRITE) console.log('\nDry run — nothing written. Re-run with --write to apply.');

  await disconnectDB();
}

run().catch(async (e) => {
  console.error(e);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
