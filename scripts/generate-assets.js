import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, '../assets');

const ICON_SIZES = [
  { name: 'icon.png', width: 29, height: 29 },
  { name: 'icon@2x.png', width: 58, height: 58 },
  { name: 'icon@3x.png', width: 87, height: 87 },
];

const LOGO_SIZES = [
  { name: 'logo.png', width: 160, height: 50 },
  { name: 'logo@2x.png', width: 320, height: 100 },
  { name: 'logo@3x.png', width: 480, height: 150 },
];

const BRAND_COLOR = '#1A1A2E';
const TEXT_COLOR = '#FFFFFF';

async function generateIcon(size) {
  const svg = `
    <svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BRAND_COLOR}" rx="4"/>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="${Math.floor(size.width * 0.5)}px"
        font-weight="bold"
        fill="${TEXT_COLOR}"
        text-anchor="middle"
        dominant-baseline="middle"
      >Y</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(ASSETS_DIR, size.name));

  console.log(`Generated ${size.name}`);
}

async function generateLogo(size) {
  const svg = `
    <svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BRAND_COLOR}" rx="6"/>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="${Math.floor(size.height * 0.45)}px"
        font-weight="bold"
        fill="${TEXT_COLOR}"
        text-anchor="middle"
        dominant-baseline="middle"
      >YEETCARD</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(ASSETS_DIR, size.name));

  console.log(`Generated ${size.name}`);
}

async function main() {
  console.log('Generating placeholder assets...\n');

  for (const size of ICON_SIZES) {
    await generateIcon(size);
  }

  for (const size of LOGO_SIZES) {
    await generateLogo(size);
  }

  console.log('\nAll assets generated successfully!');
}

main().catch(console.error);
