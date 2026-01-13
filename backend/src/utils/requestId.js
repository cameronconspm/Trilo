const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique request ID for tracing requests
 */
function generateRequestId() {
  return uuidv4();
}

/**
 * Middleware to add request ID to requests
 */
function requestIdMiddleware(req, res, next) {
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = {
  generateRequestId,
  requestIdMiddleware,
};

