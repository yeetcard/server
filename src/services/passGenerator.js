import { v4 as uuidv4 } from 'uuid';
import { hexToRgb, DEFAULT_COLORS } from '../utils/colors.js';
import config from '../config.js';

const BARCODE_FORMAT_MAP = {
  QR: 'PKBarcodeFormatQR',
  Code128: 'PKBarcodeFormatCode128',
  PDF417: 'PKBarcodeFormatPDF417',
  Aztec: 'PKBarcodeFormatAztec',
};

/**
 * Generate pass.json content for an Apple Wallet pass.
 * @param {Object} params - Pass parameters
 * @param {string} params.cardName - Display name on the pass
 * @param {string} params.barcodeData - Raw barcode content
 * @param {string} params.barcodeFormat - Barcode format (QR, Code128, PDF417, Aztec)
 * @param {string} [params.foregroundColor] - Hex color for text
 * @param {string} [params.backgroundColor] - Hex color for background
 * @param {string} [params.labelColor] - Hex color for labels
 * @param {string} [params.logoText] - Text next to logo
 * @returns {Object} pass.json object
 */
export function generatePassJson(params) {
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
    passTypeIdentifier: config.pass.passTypeIdentifier,
    serialNumber: uuidv4(),
    teamIdentifier: config.pass.teamIdentifier,
    organizationName: config.pass.organizationName,
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

export { BARCODE_FORMAT_MAP };
