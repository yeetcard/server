import rateLimit from 'express-rate-limit';
import config from '../config.js';
import logger from '../utils/logger.js';

export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  handler: (req, res) => {
    logger.warn({
      msg: 'Rate limit exceeded',
      ip: req.ip,
      apiKey: req.headers['x-api-key']?.substring(0, 8) + '...',
    });
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
    });
  },
});
