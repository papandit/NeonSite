// Express app assembly: security, CORS, body parsing, logging, routes,
// health, 404, and the global error handler (registered LAST).

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import config from './config/index.js';
import requestLogger from './middleware/requestLogger.js';
import sanitizeRequest from './middleware/sanitize.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import { health } from './controllers/healthController.js';
import { sitemap, robots } from './controllers/public/seoController.js';

const app = express();

// Trust proxy so req.ip / secure cookies work behind a reverse proxy in prod.
app.set('trust proxy', 1);

app.use(
  helmet({
    // The API serves JSON and binary assets, never HTML, so a strict CSP costs
    // nothing here and blocks anything a stored-XSS payload could try to load
    // if a file were ever served with the wrong content type.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        imgSrc: ["'self'", 'data:'],
        mediaSrc: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    // Assets are fetched cross-origin by both SPAs; the asset route sets its
    // own CORP header, so the global default must not be stricter.
    crossOriginResourcePolicy: false,
    // Tell browsers to stay on HTTPS once they have seen it. Harmless over
    // plain HTTP in dev, since the header is ignored there.
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: false },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// CORS — allow the two configured frontends (and no-origin tools like curl).
const allowedOrigins = new Set(config.cors.origins);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
// Runs before any route so no handler ever sees a Mongo operator in a body.
app.use(sanitizeRequest);
app.use(requestLogger);

// Health check (outside /api so infra probes stay simple).
app.get('/health', health);

// SEO (Phase 6)
app.get('/sitemap.xml', sitemap);
app.get('/robots.txt', robots);

// API
app.use('/api', apiRoutes);

// 404 + errors (order matters: these come last).
app.use(notFound);
app.use(errorHandler);

export default app;
