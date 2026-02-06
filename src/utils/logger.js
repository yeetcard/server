import pino from 'pino';
import config from '../config.js';

const logger = pino({
  level: config.logging.level,
  ...(config.nodeEnv === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
});

export default logger;
