// One-time sync: merge any newly-added default fonts / sizes / adapters into the
// existing NeonConfig singleton (keeps admin edits, only appends what's missing).
// Run: node src/scripts/neonSync.js   (from the server/ dir)

import { connectDB, disconnectDB } from '../db/connect.js';
import NeonConfig, { getNeonConfig } from '../models/NeonConfig.js';
import { DEFAULT_NEON } from '../config/neonDefaults.js';

async function run() {
  await connectDB();
  const cfg = await getNeonConfig();

  const mergeByKey = (existing, defaults) => {
    const keys = new Set((existing || []).map((x) => x.key));
    const additions = defaults.filter((d) => !keys.has(d.key));
    return [...(existing || []), ...additions];
  };

  const before = { fonts: cfg.fonts.length, sizes: cfg.sizes.length, adapters: cfg.adapters?.length || 0 };

  cfg.fonts = mergeByKey(cfg.fonts, DEFAULT_NEON.fonts);
  cfg.sizes = mergeByKey(cfg.sizes, DEFAULT_NEON.sizes);
  cfg.backings = mergeByKey(cfg.backings, DEFAULT_NEON.backings);
  cfg.adapters = mergeByKey(cfg.adapters, DEFAULT_NEON.adapters);
  cfg.scenes = mergeByKey(cfg.scenes, DEFAULT_NEON.scenes);

  await cfg.save();
  const after = { fonts: cfg.fonts.length, sizes: cfg.sizes.length, adapters: cfg.adapters.length };
  console.log('NeonConfig synced:', JSON.stringify({ before, after }));

  await disconnectDB();
}

run().catch((e) => { console.error(e); process.exit(1); });
