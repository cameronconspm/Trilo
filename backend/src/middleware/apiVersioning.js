const { logger } = require('../utils/logger');
const { createErrorResponse } = require('../utils/errorHandler');

/**
 * API Versioning Middleware
 * Handles API versioning for backward compatibility
 */

// Supported API versions
const SUPPORTED_VERSIONS = ['v1'];
const DEFAULT_VERSION = 'v1';

/**
 * Extract API version from request path
 * Expected format: /api/v1/plaid/...
 */
function extractVersion(req) {
  const pathParts = req.path.split('/').filter(part => part);
  
  // Check if path starts with /api
  if (pathParts[0] !== 'api') {
    return null;
  }
  
  // Check if second part is a version
  if (pathParts[1] && pathParts[1].match(/^v\d+$/)) {
    return pathParts[1];
  }
  
  return null;
}

/**
 * API Versioning Middleware
 * - Extracts version from URL path
 * - Sets req.apiVersion for use in routes
 * - Handles version deprecation warnings
 */
function apiVersioning(req, res, next) {
  const version = extractVersion(req);
  
  if (version) {
    // Version specified in path
    if (!SUPPORTED_VERSIONS.includes(version)) {
      logger.warn('Unsupported API version requested', {
        version,
        path: req.path,
        requestId: req.id,
      });
      
      return res.status(400).json(createErrorResponse(
        null,
        req,
        'Unsupported API version',
        400,
        `API version "${version}" is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      ));
    }
    
    req.apiVersion = version;
    
    // Remove version from path for routing (so routes can work without version prefix)
    // e.g., /api/v1/plaid/accounts -> /api/plaid/accounts
    const pathParts = req.path.split('/').filter(part => part);
    if (pathParts[0] === 'api' && pathParts[1] && pathParts[1].match(/^v\d+$/)) {
      req.path = '/' + pathParts.slice(2).join('/');
      req.originalPath = req.originalUrl.split('?')[0]; // Store original for logging
    }
  } else {
    // No version specified - use default
    req.apiVersion = DEFAULT_VERSION;
    
    // In the future, we might want to warn about missing version
    // For now, default to v1 for backward compatibility
    if (process.env.NODE_ENV === 'production') {
      // Log that default version is being used (for monitoring)
      logger.debug('API request without version, using default', {
        version: DEFAULT_VERSION,
        path: req.path,
        requestId: req.id,
      });
    }
  }
  
  // Add version header to response
  res.setHeader('API-Version', req.apiVersion);
  
  // Add deprecation warning header if version is deprecated
  // Example for future: if (version === 'v0') { res.setHeader('Deprecation', 'true'); }
  
  next();
}

/**
 * Create versioned route path
 * Helper function for creating versioned routes
 */
function versionedPath(version, path) {
  return `/api/${version}${path}`;
}

module.exports = {
  apiVersioning,
  versionedPath,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION,
};

