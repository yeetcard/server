import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { generatePassJson } from './passGenerator.js';
import { generateManifest } from './manifestGenerator.js';
import { signManifest } from './passSigner.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, '../../assets');

const ASSET_FILES = [
  'icon.png',
  'icon@2x.png',
  'icon@3x.png',
  'logo.png',
  'logo@2x.png',
  'logo@3x.png',
];

/**
 * Load image assets from the assets directory.
 * @returns {Map<string, Buffer>} Map of filename to file content
 */
function loadAssets() {
  const assets = new Map();

  for (const filename of ASSET_FILES) {
    const filePath = path.join(ASSETS_DIR, filename);
    if (fs.existsSync(filePath)) {
      assets.set(filename, fs.readFileSync(filePath));
    } else {
      logger.warn({ msg: `Asset file not found: ${filename}`, path: filePath });
    }
  }

  return assets;
}

/**
 * Build a complete .pkpass file.
 * @param {Object} params - Pass parameters (same as generatePassJson)
 * @returns {Promise<Buffer>} The .pkpass file as a Buffer
 */
export async function buildPkpass(params) {
  const passJson = generatePassJson(params);
  const passJsonBuffer = Buffer.from(JSON.stringify(passJson, null, 2), 'utf8');

  const assets = loadAssets();

  const files = new Map();
  files.set('pass.json', passJsonBuffer);

  for (const [filename, content] of assets) {
    files.set(filename, content);
  }

  const manifest = generateManifest(files);
  const manifestBuffer = Buffer.from(JSON.stringify(manifest), 'utf8');

  const signature = signManifest(manifestBuffer);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver('zip', { store: true });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    archive.append(passJsonBuffer, { name: 'pass.json' });
    archive.append(manifestBuffer, { name: 'manifest.json' });
    archive.append(signature, { name: 'signature' });

    for (const [filename, content] of assets) {
      archive.append(content, { name: filename });
    }

    archive.finalize();
  });
}
