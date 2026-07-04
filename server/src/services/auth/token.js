// JWT issue + verify. The only place that touches jsonwebtoken.

import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

/**
 * Issue a signed JWT for a user.
 * @param {{ id: string, role: string }} user
 * @returns {string}
 */
export function issueToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Verify a JWT and return its payload. Throws on invalid/expired tokens
 * (the global error handler maps JsonWebTokenError/TokenExpiredError to 401).
 * @param {string} token
 * @returns {{ sub: string, role: string, iat: number, exp: number }}
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
