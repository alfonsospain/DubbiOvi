const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const pngPath = path.join(__dirname, '..', 'public', 'icon.png');

if (!fs.existsSync(svgPath)) {
  console.error('[Icon Helper] Error: public/icon.svg not found.');
  process.exit(1);
}

console.log('[Icon Helper] Generating 512x512 icon.png from icon.svg...');

sharp(svgPath)
  .resize(512, 512)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('[Icon Helper] Successfully generated ' + pngPath);
  })
  .catch((err) => {
    console.error('[Icon Helper] Error generating PNG icon from SVG:', err);
    process.exit(1);
  });
