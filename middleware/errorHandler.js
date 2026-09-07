// Central error handler. Section 35 requires "safe error messages" —
// never leak stack traces or internals to the client in production.
const env = require('../config/env');

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isDev = env.nodeEnv === 'development';

  // eslint-disable-next-line no-console
  console.error(err);

  res.status(status).json({
    error: status === 500 ? 'Something went wrong.' : err.message,
    ...(isDev ? { stack: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };

