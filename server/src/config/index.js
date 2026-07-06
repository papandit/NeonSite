// Centralized config loader.
// - Loads .env once.
// - Validates REQUIRED env vars on boot and FAILS LOUDLY if any are missing.
// - Nothing else in the app should read process.env directly (invariant: config
//   is the single gateway to the environment).

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load server/.env regardless of the process CWD.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Read a required env var or collect an error.
 * @param {string} key
 * @param {string[]} missing accumulator
 */
function required(key, missing) {
  const value = process.env[key];
  if (value === undefined || value === null || String(value).trim() === '') {
    missing.push(key);
    return undefined;
  }
  return value;
}

function optional(key, fallback = undefined) {
  const value = process.env[key];
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }
  return value;
}

function toInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

const missing = [];

const env = optional('NODE_ENV', 'development');

// Vars required for the app to boot at all (Phase 0).
const config = {
  env,
  isProd: env === 'production',
  isDev: env !== 'production',

  port: toInt(optional('PORT', '5000'), 5000),

  mongo: {
    uri: required('MONGODB_URI', missing),
  },

  jwt: {
    secret: required('JWT_SECRET', missing),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },

  cors: {
    // Origins allowed to call this API. Filter out blanks.
    origins: [
      optional('CLIENT_CUSTOMER_ORIGIN', 'http://localhost:5173'),
      optional('CLIENT_ADMIN_ORIGIN', 'http://localhost:5174'),
    ].filter(Boolean),
  },

  // Public storefront URL (used for sitemap/canonical links).
  siteUrl: optional('SITE_URL', optional('CLIENT_CUSTOMER_ORIGIN', 'http://localhost:5173')),

  seedAdmin: {
    name: optional('SEED_ADMIN_NAME', 'NameCraft Admin'),
    email: optional('SEED_ADMIN_EMAIL', 'admin@namecraft.local'),
    password: optional('SEED_ADMIN_PASSWORD', 'Admin@12345'),
  },

  // Optional in Phase 0 — become required in their respective phases. We keep
  // them here so later code can read config.cloudinary etc. uniformly.
  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME'),
    apiKey: optional('CLOUDINARY_API_KEY'),
    apiSecret: optional('CLOUDINARY_API_SECRET'),
  },
  razorpay: {
    keyId: optional('RAZORPAY_KEY_ID'),
    keySecret: optional('RAZORPAY_KEY_SECRET'),
  },
  smtp: {
    host: optional('SMTP_HOST'),
    port: toInt(optional('SMTP_PORT', '587'), 587),
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    from: optional('MAIL_FROM', 'NameCraft <no-reply@namecraft.local>'),
  },

  // Gemini chatbot (optional — the widget falls back to a canned reply if absent)
  gemini: {
    apiKey: optional('GEMINI_API_KEY'),
    model: optional('GEMINI_MODEL', 'gemini-1.5-flash'),
  },
};

if (missing.length > 0) {
  // Fail loudly and exit — do not start a half-configured server.
  console.error('\n❌  Missing required environment variables:\n');
  for (const key of missing) console.error(`   - ${key}`);
  console.error(
    '\n   Copy server/.env.example to server/.env and fill these in.\n'
  );
  process.exit(1);
}

/**
 * Assert a feature's env vars are present before using it. Call from the
 * relevant service (e.g. Cloudinary in Phase 1.2) so Phase 0 can still boot
 * without those secrets, but the feature fails loudly when actually invoked.
 * @param {string} feature label e.g. 'Cloudinary'
 * @param {string[]} keys env keys that must be set
 */
export function requireFeatureEnv(feature, keys) {
  const absent = keys.filter((k) => {
    const v = process.env[k];
    return v === undefined || v === null || String(v).trim() === '';
  });
  if (absent.length > 0) {
    throw new Error(
      `${feature} is not configured. Missing env: ${absent.join(', ')}`
    );
  }
}

export default config;
