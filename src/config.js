const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  pass: {
    passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || '',
    teamIdentifier: process.env.TEAM_IDENTIFIER || '',
    organizationName: 'Yeetcard',
  },

  certificate: {
    path: process.env.CERTIFICATE_PATH || './certs/pass.p12',
    base64: process.env.CERTIFICATE_BASE64 || '',
    password: process.env.CERTIFICATE_PASSWORD || '',
    wwdrPath: process.env.WWDR_CERTIFICATE_PATH || './certs/AppleWWDRCA.pem',
  },

  auth: {
    apiKeys: (process.env.API_KEYS || '').split(',').filter(Boolean),
  },

  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
