const { logger } = require('./logger');

/**
 * Secure error response utility
 * Prevents leaking sensitive information in production
 */
function createErrorResponse(error, req, customMessage = null) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requestId = req.id || 'unknown';

  // Base error response
  const errorResponse = {
    error: customMessage || 'Internal server error',
    requestId,
  };

  // In development, include more details
  if (isDevelopment) {
    errorResponse.details = error.message || String(error);
    if (error.stack) {
      errorResponse.stack = error.stack;
    }
    if (error.code) {
      errorResponse.code = error.code;
    }
  } else {
    // In production, only include safe error information
    errorResponse.message = customMessage || 'An error occurred. Please try again later.';
  }

  return errorResponse;
}

/**
 * Error handler middleware helper
 */
function handleRouteError(error, req, res, defaultStatus = 500, customMessage = null) {
  logger.error('Route error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  const statusCode = error.statusCode || error.status || defaultStatus;
  const errorResponse = createErrorResponse(error, req, customMessage);

  return res.status(statusCode).json(errorResponse);
}

module.exports = {
  createErrorResponse,
  handleRouteError,
};

