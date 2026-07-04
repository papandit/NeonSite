// Wraps an async Express handler so rejected promises are forwarded to the
// global error handler instead of crashing the process. No raw try/catch in
// route handlers.
//
//   router.post('/login', asyncHandler(async (req, res) => { ... }));

/**
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} fn
 * @returns {import('express').RequestHandler}
 */
export default function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
