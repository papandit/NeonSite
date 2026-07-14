// One-off: add the full name-plate colour palette to a REMOTE Mongo.
// Safe + idempotent: only inserts colours that don't already exist (by name).
//   MONGODB_URI="<uri>" node src/scripts/seedRemoteColors.js          (dry run)
//   MONGODB_URI="<uri>" node src/scripts/seedRemoteColors.js --write  (apply)

import mongoose from 'mongoose';
import { NpColor } from '../modules/nameplate/registry.js';
import NpTemplate from '../modules/nameplate/models/NpTemplate.js';

const PALETTE = [
  ['Black', '#1a1a1a'], ['White', '#f8f8f8'], ['Ivory', '#fffff0'], ['Charcoal', '#2b2b2b'],
  ['Graphite', '#36393b'], ['Silver', '#c0c0c0'], ['Gold', '#c8a04d'], ['Champagne', '#f0e6c8'],
  ['Rose Gold', '#b76e79'], ['Copper', '#b87333'], ['Bronze', '#8c6a3f'], ['Cocoa', '#3a2b1d'],
  ['Maroon', '#6d1a2e'], ['Burgundy', '#7b1e3b'], ['Ruby', '#9b1c31'], ['Saffron', '#d4541f'],
  ['Coral', '#ff6b6b'], ['Amber', '#f59e0b'], ['Pink', '#ff5ea8'], ['Lavender', '#8b7bd8'],
  ['Royal Blue', '#1e3a8a'], ['Navy', '#1b2a4a'], ['Sky Blue', '#38bdf8'], ['Teal', '#0e7490'],
  ['Emerald', '#047857'], ['Forest', '#14532d'], ['Mint', '#6ee7b7'], ['Slate', '#475569'],
  ['Matte Black', '#28282b'], ['Grey', '#808080'], ['Cream', '#fffdd0'], ['Beige', '#e8d9b5'],
  ['Sand', '#c2b280'], ['Brass', '#b5a642'], ['Wine', '#722f37'], ['Crimson', '#dc143c'],
  ['Terracotta', '#cc4e3a'], ['Peach', '#ffcba4'], ['Mustard', '#e1ad01'], ['Olive', '#6b8e23'],
  ['Sage', '#9caf88'], ['Jade', '#00a86b'], ['Turquoise', '#30d5c8'], ['Steel Blue', '#4682b4'],
  ['Midnight', '#191970'], ['Indigo', '#4b0082'], ['Plum', '#8e4585'], ['Lilac', '#c8a2c8'],
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('Set MONGODB_URI'); process.exit(1); }
  const write = process.argv.includes('--write');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
  console.log('connected to', uri.replace(/\/\/[^@]*@/, '//***@'));

  const tCount = await NpTemplate.countDocuments();
  const before = await NpColor.find().select('name').lean();
  const names = new Set(before.map((c) => c.name));
  const missing = PALETTE.filter(([n]) => !names.has(n));
  console.log(`templates=${tCount}  colours=${before.length}  toAdd=${missing.length}`);

  if (write) {
    for (const [name, hex] of missing) {
      await NpColor.create({ name, status: 'active', priceDeltaPaise: 0, meta: { hex } });
    }
    console.log(`ADDED ${missing.length}. total colours now: ${await NpColor.countDocuments()}`);
  } else {
    console.log('(dry run)');
  }
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e.message); process.exit(1); });
