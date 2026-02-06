import fs from 'fs';
import forge from 'node-forge';
import config from '../config.js';
import logger from '../utils/logger.js';

let cachedCertificate = null;
let cachedPrivateKey = null;
let cachedWwdrCert = null;
let certificateExpiry = null;

/**
 * Load the Pass Type ID certificate from file or base64 environment variable.
 * @returns {Object} Object containing certificate and private key
 */
export function loadCertificate() {
  if (cachedCertificate && cachedPrivateKey) {
    return {
      certificate: cachedCertificate,
      privateKey: cachedPrivateKey,
      expiry: certificateExpiry,
    };
  }

  let p12Buffer;

  if (config.certificate.base64) {
    p12Buffer = Buffer.from(config.certificate.base64, 'base64');
  } else if (config.certificate.path) {
    if (!fs.existsSync(config.certificate.path)) {
      throw new Error(`Certificate file not found: ${config.certificate.path}`);
    }
    p12Buffer = fs.readFileSync(config.certificate.path);
  } else {
    throw new Error('No certificate configured (CERTIFICATE_PATH or CERTIFICATE_BASE64)');
  }

  const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.certificate.password);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

  const certBag = certBags[forge.pki.oids.certBag];
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

  if (!certBag || certBag.length === 0) {
    throw new Error('No certificate found in P12 file');
  }

  if (!keyBag || keyBag.length === 0) {
    throw new Error('No private key found in P12 file');
  }

  cachedCertificate = certBag[0].cert;
  cachedPrivateKey = keyBag[0].key;
  certificateExpiry = cachedCertificate.validity.notAfter;

  logger.info({
    msg: 'Certificate loaded successfully',
    expiry: certificateExpiry.toISOString(),
    subject: cachedCertificate.subject.getField('CN')?.value,
  });

  return {
    certificate: cachedCertificate,
    privateKey: cachedPrivateKey,
    expiry: certificateExpiry,
  };
}

/**
 * Load the Apple WWDR intermediate certificate.
 * @returns {Object} forge certificate object
 */
export function loadWwdrCertificate() {
  if (cachedWwdrCert) {
    return cachedWwdrCert;
  }

  if (!fs.existsSync(config.certificate.wwdrPath)) {
    throw new Error(`WWDR certificate not found: ${config.certificate.wwdrPath}`);
  }

  const wwdrPem = fs.readFileSync(config.certificate.wwdrPath, 'utf8');
  cachedWwdrCert = forge.pki.certificateFromPem(wwdrPem);

  logger.info({ msg: 'WWDR certificate loaded successfully' });

  return cachedWwdrCert;
}

/**
 * Check if the certificate is loaded and valid.
 * @returns {Object} Certificate status
 */
export function getCertificateStatus() {
  try {
    const { expiry } = loadCertificate();
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

    return {
      loaded: true,
      expiry: expiry.toISOString(),
      daysUntilExpiry,
      isExpired: expiry < now,
      isExpiringSoon: daysUntilExpiry <= 30,
    };
  } catch (error) {
    return {
      loaded: false,
      error: error.message,
    };
  }
}

/**
 * Clear cached certificates (useful for testing or certificate rotation).
 */
export function clearCertificateCache() {
  cachedCertificate = null;
  cachedPrivateKey = null;
  cachedWwdrCert = null;
  certificateExpiry = null;
}
