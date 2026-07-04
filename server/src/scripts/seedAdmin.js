// Seeds (or updates) the initial admin user from SEED_ADMIN_* env vars.
// Run: npm run seed:admin   (from repo root: npm run seed:admin)

import config from '../config/index.js';
import { connectDB, disconnectDB } from '../db/connect.js';
import User from '../models/User.js';

async function run() {
  await connectDB();

  const { name, email, password } = config.seedAdmin;
  const normalizedEmail = email.toLowerCase().trim();

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Ensure the account is an admin; leave the password as-is.
    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log(`↺  Promoted existing user to admin: ${normalizedEmail}`);
    } else {
      console.log(`✓  Admin already exists: ${normalizedEmail}`);
    }
  } else {
    user = new User({ name, email: normalizedEmail, role: 'admin' });
    await user.setPassword(password);
    await user.save();
    console.log(`✅  Created admin user: ${normalizedEmail}`);
    console.log(`    Password: ${password}  (change it after first login)`);
  }

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
