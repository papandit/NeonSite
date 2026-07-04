import mongoose from 'mongoose';
import { sendSuccess } from '../utils/apiResponse.js';
import config from '../config/index.js';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * GET /health — liveness + basic dependency status in the standard envelope.
 */
export function health(req, res) {
  return sendSuccess(res, {
    status: 'ok',
    service: 'namecraft-server',
    env: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    db: DB_STATES[mongoose.connection.readyState] || 'unknown',
  });
}
