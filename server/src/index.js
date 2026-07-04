// Entry point: connect to MongoDB, then start the HTTP server. Config is loaded
// (and validated) as a side effect of importing ./config.

import config from './config/index.js';
import app from './app.js';
import { connectDB, disconnectDB } from './db/connect.js';

async function start() {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`\n🚀  NameCraft API listening on http://localhost:${config.port}`);
    console.log(`    env=${config.env}  health=http://localhost:${config.port}/health`);
    console.log(`    CORS origins: ${config.cors.origins.join(', ') || '(none)'}\n`);
  });

  // Graceful shutdown.
  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down…`);
    server.close(async () => {
      await disconnectDB();
      console.log('Closed HTTP server and DB connection. Bye.');
      process.exit(0);
    });
    // Force-exit if it hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('❌  Failed to start server:', err);
  process.exit(1);
});
