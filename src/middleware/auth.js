import config from '../config.js';
import logger from '../utils/logger.js';

/**
 * API key authentication middleware.
 * Validates the X-API-Key header against configured API keys.
 */
export function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn({ msg: 'Missing API key', ip: req.ip });
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or missing API key',
    });
  }

  if (!config.auth.apiKeys.includes(apiKey)) {
    logger.warn({ msg: 'Invalid API key', ip: req.ip });
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or missing API key',
    });
  }

  next();
}
