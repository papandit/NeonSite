// Backs up the Asset collection to a folder of real files plus a manifest, and
// restores from one. Written because the binary asset store lives inside Mongo:
// optimizeAssets.js rewrites those bytes in place, so there has to be a way
// back that does not depend on mongodump being installed.
//
// Each asset becomes <id>.<ext> on disk with its metadata in manifest.json, so
// a backup is also just a folder of images you can open and eyeball.
//
//   Back up:  node src/scripts/backupAssets.js --out=../backups/assets-2026-08-02
//   Restore:  node src/scripts/backupAssets.js --restore=../backups/assets-2026-08-02 --write
//
// Restore is a dry run without --write. It only writes assets whose stored
// bytes differ from the backup, and never creates or deletes documents, so
// running it after an optimize pass simply puts the originals back.
//
// Point at another database by overriding MONGODB_URI for the run. Read it from
// a file to keep the credential out of your shell history:
//
//   MONGODB_URI="$(cat ../secrets/prod-uri.txt)" node src/scripts/backupAssets.js --out=…

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../db/connect.js';
import Asset from '../models/Asset.js';

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : '';
};

const WRITE = process.argv.includes('--write');
const OUT = arg('out');
const RESTORE = arg('restore');

const EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/ttf': 'ttf',
  'font/otf': 'otf',
};

const mb = (n) => `${(n / 1048576).toFixed(1)}MB`;

async function backup(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const manifest = [];
  let bytes = 0;

  const cursor = Asset.find({}).cursor();
  for await (const doc of cursor) {
    const ext = EXT[doc.contentType] || 'bin';
    const file = `${doc._id}.${ext}`;
    const data = doc.data?.buffer ? Buffer.from(doc.data.buffer) : doc.data;
    fs.writeFileSync(path.join(dir, file), data);
    bytes += data.length;
    manifest.push({
      _id: String(doc._id),
      file,
      contentType: doc.contentType,
      filename: doc.filename || '',
      kind: doc.kind || 'image',
      folder: doc.folder || '',
      bytes: data.length,
    });
  }

  fs.writeFileSync(
    path.join(dir, 'manifest.json'),
    JSON.stringify({ database: mongoose.connection.db.databaseName, count: manifest.length, bytes, assets: manifest }, null, 2),
  );
  console.log(`backed up ${manifest.length} assets (${mb(bytes)}) to ${dir}`);
}

async function restore(dir) {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`no manifest.json in ${dir}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`backup of "${manifest.database}": ${manifest.count} assets (${mb(manifest.bytes)})`);

  let restored = 0;
  let same = 0;
  let missing = 0;

  for (const a of manifest.assets) {
    const file = path.join(dir, a.file);
    if (!fs.existsSync(file)) { missing += 1; continue; }
    const current = await Asset.findById(a._id, { bytes: 1 }).lean();
    if (!current) { missing += 1; continue; }
    if (current.bytes === a.bytes) { same += 1; continue; }

    restored += 1;
    console.log(`  restore ${a.filename || a._id}: ${current.bytes} -> ${a.bytes} bytes`);
    if (WRITE) {
      await Asset.updateOne(
        { _id: a._id },
        { $set: { data: fs.readFileSync(file), contentType: a.contentType, bytes: a.bytes } },
      );
    }
  }

  console.log(`\nrestored ${restored}, unchanged ${same}, missing ${missing}`);
  if (!WRITE) console.log('Dry run — nothing written. Re-run with --write to apply.');
}

async function run() {
  if (!OUT && !RESTORE) {
    console.error('Pass --out=<dir> to back up, or --restore=<dir> to restore.');
    process.exit(1);
  }
  await connectDB();
  console.log(`database: ${mongoose.connection.db.databaseName}\n`);
  if (RESTORE) await restore(path.resolve(process.cwd(), RESTORE));
  else await backup(path.resolve(process.cwd(), OUT));
  await disconnectDB();
}

run().catch(async (e) => {
  console.error(e);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
