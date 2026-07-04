// Standard API response shape: { success, data, error }.
// Every response the API sends goes through one of these so clients can rely on
// a single, predictable envelope.

/**
 * Send a success envelope.
 * @param {import('express').Response} res
 * @param {*} data payload
 * @param {number} [status=200]
 * @param {object} [meta] optional extra fields merged at top level (e.g. pagination)
 */
export function sendSuccess(res, data = null, status = 200, meta = undefined) {
  const body = { success: true, data, error: null };
  if (meta && typeof meta === 'object') Object.assign(body, meta);
  return res.status(status).json(body);
}

/**
 * Send an error envelope.
 * @param {import('express').Response} res
 * @param {{ message: string, code?: string, details?: * }} error
 * @param {number} [status=400]
 */
export function sendError(res, error, status = 400) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      message: error.message || 'Something went wrong',
      code: error.code || undefined,
      details: error.details || undefined,
    },
  });
}
