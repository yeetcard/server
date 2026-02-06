import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validatePassRequest } from '../middleware/validation.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';
import { buildPkpass } from '../services/pkpassBuilder.js';
import logger from '../utils/logger.js';

const router = Router();

router.post(
  '/v1/passes',
  rateLimitMiddleware,
  authMiddleware,
  validatePassRequest,
  async (req, res) => {
    const startTime = Date.now();

    try {
      const pkpassBuffer = await buildPkpass(req.validatedBody);

      const duration = Date.now() - startTime;
      logger.info({
        msg: 'Pass generated successfully',
        cardName: req.validatedBody.cardName,
        barcodeFormat: req.validatedBody.barcodeFormat,
        durationMs: duration,
      });

      res.set({
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="pass.pkpass"',
        'Content-Length': pkpassBuffer.length,
      });

      res.send(pkpassBuffer);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({
        msg: 'Failed to generate pass',
        error: error.message,
        stack: error.stack,
        durationMs: duration,
      });

      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to generate pass. Please try again.',
      });
    }
  }
);

export default router;
