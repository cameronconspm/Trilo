const winston = require('winston');
const crypto = require('crypto');

/**
 * Secure logger utility that redacts sensitive information
 */

// Create winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'trilo-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

/**
 * Hash a value for logging (one-way hash, cannot be reversed)
 * Used to log identifiers without exposing actual values
 */
function hashForLogging(value) {
  if (!value || typeof value !== 'string') {
    return '[REDACTED]';
  }
  // Use SHA-256 to create a consistent hash
  // Only use first 8 characters for readability
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 8);
}

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  const sensitiveKeys = [
    'access_token',
    'public_token',
    'token',
    'password',
    'secret',
    'key',
    'authorization',
    'authorization_header',
    'api_key',
    'apiKey',
    'private_key',
    'privateKey',
    'account_number',
    'accountNumber',
    'routing_number',
    'routingNumber',
    'ssn',
    'social_security',
    'phone',
    'phoneNumber',
    'phone_number',
    'email',
    'emailAddress',
  ];

  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitiveKey => 
      keyLower.includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      if (typeof value === 'string' && value.length > 0) {
        // For tokens, show first 4 and last 4 chars if long enough
        if (value.length > 12 && (keyLower.includes('token') || keyLower.includes('key'))) {
          redacted[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          redacted[key] = '[REDACTED]';
        }
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else if (key === 'userId' || key === 'user_id' || key === 'id') {
      // Hash user IDs for logging
      redacted[key] = typeof value === 'string' ? hashForLogging(value) : value;
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value, depth + 1);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Log methods with sensitive data redaction
 */
const secureLogger = {
  error: (message, meta = {}) => {
    logger.error(message, redactSensitiveData(meta));
  },
  warn: (message, meta = {}) => {
    logger.warn(message, redactSensitiveData(meta));
  },
  info: (message, meta = {}) => {
    logger.info(message, redactSensitiveData(meta));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(message, redactSensitiveData(meta));
    }
  },
  verbose: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.verbose(message, redactSensitiveData(meta));
    }
  },
};

module.exports = {
  logger: secureLogger,
  hashForLogging,
  redactSensitiveData,
  // Export winston logger for advanced use cases
  winstonLogger: logger,
};

