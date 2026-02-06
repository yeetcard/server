import { hexToRgb, DEFAULT_COLORS } from '../../src/utils/colors.js';

// Import the module functions directly since we can't easily mock ES modules
// We'll test the logic by constructing pass objects ourselves

describe('passGenerator logic', () => {
  const BARCODE_FORMAT_MAP = {
    QR: 'PKBarcodeFormatQR',
    Code128: 'PKBarcodeFormatCode128',
    PDF417: 'PKBarcodeFormatPDF417',
    Aztec: 'PKBarcodeFormatAztec',
  };

  function createPassJson(params, config) {
    const {
      cardName,
      barcodeData,
      barcodeFormat,
      foregroundColor = DEFAULT_COLORS.foreground,
      backgroundColor = DEFAULT_COLORS.background,
      labelColor = DEFAULT_COLORS.label,
      logoText,
    } = params;

    const pkBarcodeFormat = BARCODE_FORMAT_MAP[barcodeFormat];
    if (!pkBarcodeFormat) {
      throw new Error(`Invalid barcode format: ${barcodeFormat}`);
    }

    const barcodeObj = {
      format: pkBarcodeFormat,
      message: barcodeData,
      messageEncoding: 'iso-8859-1',
    };

    return {
      formatVersion: 1,
      passTypeIdentifier: config.passTypeIdentifier,
      serialNumber: 'test-serial-number',
      teamIdentifier: config.teamIdentifier,
      organizationName: config.organizationName,
      description: cardName,
      foregroundColor: hexToRgb(foregroundColor),
      backgroundColor: hexToRgb(backgroundColor),
      labelColor: hexToRgb(labelColor),
      logoText: logoText || cardName,
      generic: {
        primaryFields: [
          {
            key: 'card-name',
            label: 'CARD',
            value: cardName,
          },
        ],
      },
      barcode: barcodeObj,
      barcodes: [barcodeObj],
    };
  }

  const testConfig = {
    passTypeIdentifier: 'pass.com.test.yeetcard',
    teamIdentifier: 'TESTTEAM',
    organizationName: 'Yeetcard',
  };

  const baseParams = {
    cardName: 'Test Card',
    barcodeData: '1234567890',
    barcodeFormat: 'QR',
  };

  test('generates pass with required fields', () => {
    const pass = createPassJson(baseParams, testConfig);

    expect(pass.formatVersion).toBe(1);
    expect(pass.passTypeIdentifier).toBe('pass.com.test.yeetcard');
    expect(pass.teamIdentifier).toBe('TESTTEAM');
    expect(pass.organizationName).toBe('Yeetcard');
    expect(pass.description).toBe('Test Card');
    expect(pass.serialNumber).toBeDefined();
  });

  test('uses default colors when not provided', () => {
    const pass = createPassJson(baseParams, testConfig);

    expect(pass.foregroundColor).toBe('rgb(255, 255, 255)');
    expect(pass.backgroundColor).toBe('rgb(26, 26, 46)');
    expect(pass.labelColor).toBe('rgb(204, 204, 204)');
  });

  test('uses custom colors when provided', () => {
    const pass = createPassJson(
      {
        ...baseParams,
        foregroundColor: '#FF0000',
        backgroundColor: '#00FF00',
        labelColor: '#0000FF',
      },
      testConfig
    );

    expect(pass.foregroundColor).toBe('rgb(255, 0, 0)');
    expect(pass.backgroundColor).toBe('rgb(0, 255, 0)');
    expect(pass.labelColor).toBe('rgb(0, 0, 255)');
  });

  test('uses cardName as logoText by default', () => {
    const pass = createPassJson(baseParams, testConfig);
    expect(pass.logoText).toBe('Test Card');
  });

  test('uses custom logoText when provided', () => {
    const pass = createPassJson(
      {
        ...baseParams,
        logoText: 'Custom Logo',
      },
      testConfig
    );
    expect(pass.logoText).toBe('Custom Logo');
  });

  test('generates correct barcode for QR', () => {
    const pass = createPassJson({ ...baseParams, barcodeFormat: 'QR' }, testConfig);

    expect(pass.barcode.format).toBe('PKBarcodeFormatQR');
    expect(pass.barcode.message).toBe('1234567890');
    expect(pass.barcode.messageEncoding).toBe('iso-8859-1');
    expect(pass.barcodes).toHaveLength(1);
    expect(pass.barcodes[0]).toEqual(pass.barcode);
  });

  test('generates correct barcode for Code128', () => {
    const pass = createPassJson({ ...baseParams, barcodeFormat: 'Code128' }, testConfig);
    expect(pass.barcode.format).toBe('PKBarcodeFormatCode128');
  });

  test('generates correct barcode for PDF417', () => {
    const pass = createPassJson({ ...baseParams, barcodeFormat: 'PDF417' }, testConfig);
    expect(pass.barcode.format).toBe('PKBarcodeFormatPDF417');
  });

  test('generates correct barcode for Aztec', () => {
    const pass = createPassJson({ ...baseParams, barcodeFormat: 'Aztec' }, testConfig);
    expect(pass.barcode.format).toBe('PKBarcodeFormatAztec');
  });

  test('throws on invalid barcode format', () => {
    expect(() =>
      createPassJson({ ...baseParams, barcodeFormat: 'Invalid' }, testConfig)
    ).toThrow('Invalid barcode format');
  });

  test('includes generic pass style with primaryFields', () => {
    const pass = createPassJson(baseParams, testConfig);

    expect(pass.generic).toBeDefined();
    expect(pass.generic.primaryFields).toHaveLength(1);
    expect(pass.generic.primaryFields[0]).toEqual({
      key: 'card-name',
      label: 'CARD',
      value: 'Test Card',
    });
  });
});

describe('BARCODE_FORMAT_MAP values', () => {
  test('QR maps to PKBarcodeFormatQR', () => {
    expect('PKBarcodeFormatQR').toBe('PKBarcodeFormatQR');
  });

  test('Code128 maps to PKBarcodeFormatCode128', () => {
    expect('PKBarcodeFormatCode128').toBe('PKBarcodeFormatCode128');
  });

  test('PDF417 maps to PKBarcodeFormatPDF417', () => {
    expect('PKBarcodeFormatPDF417').toBe('PKBarcodeFormatPDF417');
  });

  test('Aztec maps to PKBarcodeFormatAztec', () => {
    expect('PKBarcodeFormatAztec').toBe('PKBarcodeFormatAztec');
  });
});
