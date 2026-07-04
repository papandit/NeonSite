// Request logging. Uses morgan with a concise dev format, plus a tiny custom
// token for the authenticated user id so logs are traceable.

import morgan from 'morgan';
import config from '../config/index.js';

morgan.token('userId', (req) => (req.user ? String(req.user.id) : '-'));

const format = config.isProd
  ? ':remote-addr :method :url :status :res[content-length] - :response-time ms user=:userId'
  : ':method :url :status :response-time ms - user=:userId';

const requestLogger = morgan(format);

export default requestLogger;
