// MongoDB connection with retry + clear startup logging.

import mongoose from 'mongoose';
import config from '../config/index.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fail fast on programmer errors like querying an unknown field.
mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB, retrying a few times before giving up.
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB() {
  const redactedUri = config.mongo.uri.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      console.log(`🔌  Connecting to MongoDB (attempt ${attempt}/${MAX_RETRIES})…`);
      await mongoose.connect(config.mongo.uri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅  MongoDB connected: ${redactedUri}`);

      mongoose.connection.on('error', (err) => {
        console.error('⚠️   MongoDB connection error:', err.message);
      });
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️   MongoDB disconnected.');
      });

      return mongoose;
    } catch (err) {
      console.error(`❌  MongoDB connection failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s…`);
        await delay(RETRY_DELAY_MS);
      } else {
        console.error('❌  Could not connect to MongoDB after all retries. Exiting.');
        throw err;
      }
    }
  }
  // Unreachable, but keeps the type checker happy.
  throw new Error('MongoDB connection failed');
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
