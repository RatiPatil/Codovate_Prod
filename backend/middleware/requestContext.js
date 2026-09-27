const crypto = require('crypto');

/**
 * Request context middleware.
 * Attaches a unique request ID, start time, and correlation header to every incoming request.
 */
function requestContext(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  req.requestId = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);
  next();
}

module.exports = requestContext;
