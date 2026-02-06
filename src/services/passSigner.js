import forge from 'node-forge';
import { loadCertificate, loadWwdrCertificate } from './certificateService.js';

/**
 * Create a PKCS7 detached signature for the manifest.
 * @param {Buffer} manifestData - The manifest.json content as a Buffer
 * @returns {Buffer} The binary signature (DER format)
 */
export function signManifest(manifestData) {
  const { certificate, privateKey } = loadCertificate();
  const wwdrCert = loadWwdrCertificate();

  const p7 = forge.pkcs7.createSignedData();

  p7.content = forge.util.createBuffer(manifestData.toString('binary'));

  p7.addCertificate(certificate);
  p7.addCertificate(wwdrCert);

  p7.addSigner({
    key: privateKey,
    certificate: certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date(),
      },
    ],
  });

  p7.sign({ detached: true });

  const asn1 = p7.toAsn1();
  const der = forge.asn1.toDer(asn1).getBytes();

  return Buffer.from(der, 'binary');
}
