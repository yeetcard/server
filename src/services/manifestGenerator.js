import { createHash } from 'crypto';

/**
 * Calculate SHA-1 hash of data.
 * @param {Buffer|string} data - Data to hash
 * @returns {string} Hex-encoded SHA-1 hash
 */
export function sha1Hash(data) {
  return createHash('sha1').update(data).digest('hex');
}

/**
 * Generate manifest.json for a pass bundle.
 * The manifest contains SHA-1 hashes of all files in the pass.
 * @param {Map<string, Buffer>} files - Map of filename to file content
 * @returns {Object} Manifest object with filename -> hash mapping
 */
export function generateManifest(files) {
  const manifest = {};

  for (const [filename, content] of files) {
    manifest[filename] = sha1Hash(content);
  }

  return manifest;
}
