// One-time migration for the review changes:
//
//  1. Drops the unique { product, user } index. It enforced one review per
//     customer per product; repeat reviews are now allowed and rate limiting
//     handles abuse instead. Mongoose creates the non-unique replacement on
//     boot, but it will never *remove* the old unique one — that has to be done
//     explicitly, and until it is, every second review fails with E11000.
//
//  2. Backfills Product.numReviews from approved reviews, and Product.soldCount
//     from order history, so the "most reviewed" and "best selling" sorts have
//     something to order by on day one.
//
//   Preview (read-only):  node src/scripts/migrateReviews.js
//   Apply:                node src/scripts/migrateReviews.js --write

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../db/connect.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const WRITE = process.argv.includes('--write');

async function dropUniqueIndex() {
  const coll = mongoose.connection.db.collection('reviews');
  const indexes = await coll.indexes();
  const unique = indexes.find((i) => i.unique && i.key?.product === 1 && i.key?.user === 1);
  if (!unique) {
    console.log('unique { product, user } index: already gone');
    return;
  }
  console.log(`unique { product, user } index: found as "${unique.name}"`);
  if (WRITE) {
    await coll.dropIndex(unique.name);
    console.log('   dropped — repeat reviews are now possible');
  }
}

async function backfillReviewCounts() {
  const rows = await Review.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  console.log(`\nnumReviews: ${rows.length} products have approved reviews`);
  if (!WRITE || !rows.length) return;
  await Product.bulkWrite(
    rows.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: { $set: { numReviews: r.count, rating: Math.round(r.avg * 10) / 10 } },
      },
    })),
    { ordered: false },
  );
  console.log('   written');
}

async function backfillSoldCounts() {
  const rows = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.product': { $ne: null } } },
    { $group: { _id: '$items.product', sold: { $sum: { $ifNull: ['$items.quantity', 1] } } } },
  ]);
  const top = [...rows].sort((a, b) => b.sold - a.sold).slice(0, 5);
  console.log(`\nsoldCount: ${rows.length} products have been ordered`);
  top.forEach((r) => console.log(`   ${r.sold}x  ${r._id}`));
  if (!WRITE || !rows.length) return;
  await Product.bulkWrite(
    rows.map((r) => ({ updateOne: { filter: { _id: r._id }, update: { $set: { soldCount: r.sold } } } })),
    { ordered: false },
  );
  console.log('   written');
}

async function run() {
  await connectDB();
  console.log(`database: ${mongoose.connection.db.databaseName}   mode: ${WRITE ? 'WRITE' : 'dry run'}\n`);
  await dropUniqueIndex();
  await backfillReviewCounts();
  await backfillSoldCounts();
  if (!WRITE) console.log('\nDry run — nothing written. Re-run with --write to apply.');
  await disconnectDB();
}

run().catch(async (e) => {
  console.error(e);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
