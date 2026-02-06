import { passRequestSchema } from '../../src/middleware/validation.js';

describe('passRequestSchema', () => {
  const validRequest = {
    cardName: 'Test Card',
    barcodeData: '1234567890',
    barcodeFormat: 'QR',
  };

  describe('required fields', () => {
    test('accepts valid minimal request', () => {
      const result = passRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    test('rejects missing cardName', () => {
      const result = passRequestSchema.safeParse({
        barcodeData: '123',
        barcodeFormat: 'QR',
      });
      expect(result.success).toBe(false);
    });

    test('rejects empty cardName', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        cardName: '',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing barcodeData', () => {
      const result = passRequestSchema.safeParse({
        cardName: 'Test',
        barcodeFormat: 'QR',
      });
      expect(result.success).toBe(false);
    });

    test('rejects empty barcodeData', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        barcodeData: '',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing barcodeFormat', () => {
      const result = passRequestSchema.safeParse({
        cardName: 'Test',
        barcodeData: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('barcodeFormat validation', () => {
    test('accepts QR', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        barcodeFormat: 'QR',
      });
      expect(result.success).toBe(true);
    });

    test('accepts Code128', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        barcodeFormat: 'Code128',
      });
      expect(result.success).toBe(true);
    });

    test('accepts PDF417', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        barcodeFormat: 'PDF417',
      });
      expect(result.success).toBe(true);
    });

    test('accepts Aztec', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        barcodeFormat: 'Aztec',
      });
      expect(result.success).toBe(true);
    });

    test('rejects invalid format', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        barcodeFormat: 'Invalid',
      });
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('QR, Code128, PDF417, Aztec');
    });

    test('rejects lowercase format', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        barcodeFormat: 'qr',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('color validation', () => {
    test('accepts valid hex foregroundColor with #', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        foregroundColor: '#FFFFFF',
      });
      expect(result.success).toBe(true);
    });

    test('accepts valid hex foregroundColor without #', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        foregroundColor: 'FFFFFF',
      });
      expect(result.success).toBe(true);
    });

    test('accepts lowercase hex color', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        backgroundColor: '#ffffff',
      });
      expect(result.success).toBe(true);
    });

    test('rejects short hex color', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        foregroundColor: '#FFF',
      });
      expect(result.success).toBe(false);
    });

    test('rejects rgb format', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        foregroundColor: 'rgb(255,255,255)',
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid hex characters', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        labelColor: '#GGGGGG',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('optional fields', () => {
    test('accepts all optional fields', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        foregroundColor: '#FF0000',
        backgroundColor: '#00FF00',
        labelColor: '#0000FF',
        logoText: 'Custom Logo',
      });
      expect(result.success).toBe(true);
      expect(result.data.logoText).toBe('Custom Logo');
    });

    test('accepts empty logoText', () => {
      const result = passRequestSchema.safeParse({
        ...validRequest,
        logoText: '',
      });
      expect(result.success).toBe(true);
    });
  });
});
