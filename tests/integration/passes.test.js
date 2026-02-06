import request from 'supertest';
import express from 'express';
import { validatePassRequest } from '../../src/middleware/validation.js';

describe('Validation middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/test', validatePassRequest, (req, res) => {
      res.json({ validatedBody: req.validatedBody });
    });
  });

  test('returns 400 for missing cardName', async () => {
    const response = await request(app).post('/test').send({
      barcodeData: '123',
      barcodeFormat: 'QR',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });

  test('returns 400 for invalid barcodeFormat', async () => {
    const response = await request(app).post('/test').send({
      cardName: 'Test',
      barcodeData: '123',
      barcodeFormat: 'Invalid',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
    expect(response.body.field).toBe('barcodeFormat');
  });

  test('returns 400 for invalid color format', async () => {
    const response = await request(app).post('/test').send({
      cardName: 'Test',
      barcodeData: '123',
      barcodeFormat: 'QR',
      foregroundColor: 'not-a-color',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });

  test('passes valid request', async () => {
    const response = await request(app).post('/test').send({
      cardName: 'Test Card',
      barcodeData: '1234567890',
      barcodeFormat: 'QR',
    });

    expect(response.status).toBe(200);
    expect(response.body.validatedBody).toEqual({
      cardName: 'Test Card',
      barcodeData: '1234567890',
      barcodeFormat: 'QR',
    });
  });

  test('passes valid request with all optional fields', async () => {
    const response = await request(app).post('/test').send({
      cardName: 'Test Card',
      barcodeData: '1234567890',
      barcodeFormat: 'Code128',
      foregroundColor: '#FF0000',
      backgroundColor: '#00FF00',
      labelColor: '#0000FF',
      logoText: 'Custom',
    });

    expect(response.status).toBe(200);
    expect(response.body.validatedBody.barcodeFormat).toBe('Code128');
    expect(response.body.validatedBody.foregroundColor).toBe('#FF0000');
    expect(response.body.validatedBody.logoText).toBe('Custom');
  });
});

describe('Authentication middleware (inline)', () => {
  // Test the auth logic directly without config dependency
  function createAuthMiddleware(apiKeys) {
    return (req, res, next) => {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey || !apiKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Invalid or missing API key',
        });
      }

      next();
    };
  }

  let app;
  const testApiKeys = ['test-api-key', 'another-key'];

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/test', createAuthMiddleware(testApiKeys), (req, res) => {
      res.json({ success: true });
    });
  });

  test('returns 401 without API key', async () => {
    const response = await request(app).post('/test').send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  test('returns 401 with invalid API key', async () => {
    const response = await request(app)
      .post('/test')
      .set('X-API-Key', 'invalid-key')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  test('accepts valid API key', async () => {
    const response = await request(app)
      .post('/test')
      .set('X-API-Key', 'test-api-key')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('accepts any valid API key from list', async () => {
    const response = await request(app)
      .post('/test')
      .set('X-API-Key', 'another-key')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('Combined auth and validation', () => {
  function createAuthMiddleware(apiKeys) {
    return (req, res, next) => {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey || !apiKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Invalid or missing API key',
        });
      }

      next();
    };
  }

  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const authMiddleware = createAuthMiddleware(['test-api-key']);
    app.post('/test', authMiddleware, validatePassRequest, (req, res) => {
      res.json({ success: true, body: req.validatedBody });
    });
  });

  test('auth runs before validation', async () => {
    // Missing API key should return 401, not 400
    const response = await request(app).post('/test').send({});

    expect(response.status).toBe(401);
  });

  test('full valid request works', async () => {
    const response = await request(app)
      .post('/test')
      .set('X-API-Key', 'test-api-key')
      .send({
        cardName: 'Test Card',
        barcodeData: '1234567890',
        barcodeFormat: 'QR',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('validation runs after auth', async () => {
    const response = await request(app)
      .post('/test')
      .set('X-API-Key', 'test-api-key')
      .send({
        barcodeFormat: 'Invalid',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });
});
