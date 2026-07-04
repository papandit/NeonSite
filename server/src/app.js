// Express app assembly: security, CORS, body parsing, logging, routes,
// health, 404, and the global error handler (registered LAST).

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import config from './config/index.js';
import requestLogger from './middleware/requestLogger.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import { health } from './controllers/healthController.js';
import { sitemap, robots } from './controllers/public/seoController.js';

const app = express();

// Trust proxy so req.ip / secure cookies work behind a reverse proxy in prod.
app.set('trust proxy', 1);

app.use(helmet());

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
app.use(express.urlencoded({ extended: true }));
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
