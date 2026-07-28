// Rewrites absolute asset URLs (e.g. "http://localhost:5000/api/assets/<id>")
// to ROOT-RELATIVE ones ("/api/assets/<id>") across every collection that stores
// them. Absolute URLs baked in the origin of whichever machine did the upload —
// so an image added on localhost pointed at the *visitor's* machine once
// deployed, and one added on staging kept pointing at staging.
//
//   Preview (read-only):  node src/scripts/normalizeAssetUrls.js
//   Apply:                node src/scripts/normalizeAssetUrls.js --write

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../db/connect.js';

const ABS = /https?:\/\/[^"'\s]*?(\/api\/assets\/[a-f0-9]{24})/gi;

const hasAbs = (v) => typeof v === 'string' && /https?:\/\/[^"'\s]*\/api\/assets\//i.test(v);
const fix = (v) => v.replace(ABS, '$1');

// Recursively rewrite every string in a document (handles nested design docs).
function walk(value, stats) {
  if (typeof value === 'string') {
    if (!hasAbs(value)) return value;
    stats.strings += 1;
    return fix(value);
  }
  if (Array.isArray(value)) return value.map((v) => walk(v, stats));
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof mongoose.Types.ObjectId) && !Buffer.isBuffer(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, stats);
    return out;
  }
  return value;
}

async function run() {
  const write = process.argv.includes('--write');
  await connectDB();
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let totalDocs = 0;
  let totalStrings = 0;

  for (const { name } of collections) {
    if (name === 'assets') continue; // binary payloads, no URLs
    const col = db.collection(name);
    // Cheap pre-filter: only scan docs whose JSON contains an absolute asset URL.
    const docs = await col.find({}).toArray();
    let touched = 0;
    for (const doc of docs) {
      const stats = { strings: 0 };
      const next = walk(doc, stats);
      if (!stats.strings) continue;
      touched += 1;
      totalStrings += stats.strings;
      if (write) {
        const { _id, ...rest } = next;
        await col.replaceOne({ _id: doc._id }, rest);
      }
    }
    if (touched) {
      totalDocs += touched;
      console.log(`  ${name}: ${touched} document(s)`);
    }
  }

  console.log(`\n${write ? '✅ Rewrote' : 'Would rewrite'} ${totalStrings} URL(s) across ${totalDocs} document(s).`);
  if (!write) console.log('(dry run — re-run with --write to apply)');
  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
