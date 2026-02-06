import express from 'express';
import helmet from 'helmet';
import config from './config.js';
import logger from './utils/logger.js';
import healthRoutes from './routes/health.js';
import passesRoutes from './routes/passes.js';
import { loadCertificate, loadWwdrCertificate } from './services/certificateService.js';

const app = express();

app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      msg: 'request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

app.use('/api', healthRoutes);
app.use('/api', passesRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found',
  });
});

app.use((err, req, res, _next) => {
  logger.error({ msg: 'Unhandled error', error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'internal_error',
    message: 'An unexpected error occurred',
  });
});

async function start() {
  try {
    logger.info({ msg: 'Loading certificates...' });
    loadCertificate();
    loadWwdrCertificate();
    logger.info({ msg: 'Certificates loaded successfully' });
  } catch (error) {
    logger.warn({
      msg: 'Certificate loading failed - service will run but pass generation will fail',
      error: error.message,
    });
  }

  app.listen(config.port, () => {
    logger.info({
      msg: 'Server started',
      port: config.port,
      env: config.nodeEnv,
    });
  });
}

start();

export default app;
