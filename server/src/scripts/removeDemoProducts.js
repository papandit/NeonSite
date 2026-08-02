// Removes the placeholder catalogue the early seeds created — the products
// whose photos are picsum.photos URLs. They are recognisable precisely because
// nothing real ever points at picsum: a genuine product's images live in the
// Asset collection (/api/assets/:id) or Cloudinary.
//
// Orders snapshot what was bought (INVARIANT 5), so deleting a product cannot
// alter order history. The script still counts orders referencing each match
// and refuses to touch those unless you pass --force, because a live product
// someone actually purchased is almost certainly not demo data.
//
//   Preview (read-only):  node src/scripts/removeDemoProducts.js
//   Apply:                node src/scripts/removeDemoProducts.js --write
//
// Also fixes the stored store name, which the model default cannot change once
// a Settings document exists:
//
//   node src/scripts/removeDemoProducts.js --write --store-name="Daxon"

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../db/connect.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

const WRITE = process.argv.includes('--write');
const FORCE = process.argv.includes('--force');
const STORE_NAME = (process.argv.find((a) => a.startsWith('--store-name=')) || '').split('=').slice(1).join('=');

const PLACEHOLDER = /picsum\.photos/i;

async function run() {
  await connectDB();
  console.log(`database: ${mongoose.connection.db.databaseName}   mode: ${WRITE ? 'WRITE' : 'dry run'}\n`);

  const all = await Product.find({}, { name: 1, slug: 1, images: 1, isNeon: 1 }).lean();
  const demo = all.filter((p) => (p.images || []).some((u) => typeof u === 'string' && PLACEHOLDER.test(u)));

  if (!demo.length) {
    console.log('No placeholder products found.');
  } else {
    const ids = demo.map((p) => p._id);
    const ordered = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: ids } } },
      { $group: { _id: '$items.product', orders: { $sum: 1 } } },
    ]);
    const orderCount = new Map(ordered.map((o) => [String(o._id), o.orders]));

    const safe = demo.filter((p) => !orderCount.has(String(p._id)));
    const purchased = demo.filter((p) => orderCount.has(String(p._id)));

    demo.forEach((p) => {
      const n = orderCount.get(String(p._id)) || 0;
      console.log(`  ${n ? `[${n} order${n > 1 ? 's' : ''}] ` : ''}${p.name}  (${p.slug})`);
    });

    const target = FORCE ? demo : safe;
    console.log(`\n${demo.length} placeholder products; ${purchased.length} appear in orders.`);
    if (purchased.length && !FORCE) console.log('Those are kept — pass --force to remove them too.');

    if (WRITE && target.length) {
      const res = await Product.deleteMany({ _id: { $in: target.map((p) => p._id) } });
      console.log(`deleted ${res.deletedCount} products`);
    } else {
      console.log(`would delete ${target.length} products`);
    }
  }

  if (STORE_NAME) {
    const settings = await Settings.findOne();
    if (!settings) console.log('\nNo settings document to rename.');
    else {
      console.log(`\nstore name: "${settings.storeName}" -> "${STORE_NAME}"`);
      if (WRITE) {
        settings.storeName = STORE_NAME;
        await settings.save();
      }
    }
  }

  if (!WRITE) console.log('\nDry run — nothing written. Re-run with --write to apply.');
  await disconnectDB();
}

run().catch(async (e) => {
  console.error(e);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
