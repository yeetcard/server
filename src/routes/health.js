import { Router } from 'express';
import { getCertificateStatus } from '../services/certificateService.js';

const router = Router();

router.get('/health', (req, res) => {
  const certStatus = getCertificateStatus();

  res.json({
    status: certStatus.loaded && !certStatus.isExpired ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    certificateLoaded: certStatus.loaded,
    certificateExpiry: certStatus.expiry || null,
    ...(certStatus.isExpiringSoon && { warning: 'Certificate expiring soon' }),
    ...(certStatus.isExpired && { error: 'Certificate has expired' }),
    ...(!certStatus.loaded && { error: certStatus.error }),
  });
});

export default router;
