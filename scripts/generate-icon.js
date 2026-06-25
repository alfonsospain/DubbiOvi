const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const pngPath = path.join(__dirname, '..', 'public', 'icon.png');
const icoPath = path.join(__dirname, '..', 'public', 'icon.ico');

if (!fs.existsSync(svgPath)) {
  console.error('[Icon Helper] Error: public/icon.svg not found.');
  process.exit(1);
}

async function generateIcons() {
  try {
    // 1. Generate 512x512 PNG for macOS
    console.log('[Icon Helper] Generating 512x512 icon.png from icon.svg...');
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(pngPath);
    console.log('[Icon Helper] Successfully generated ' + pngPath);

    // 2. Generate PNG buffers for multiple sizes for the ICO file
    console.log('[Icon Helper] Generating multi-resolution icon.ico (16x16, 32x32, 48x48, 256x256)...');
    const resolutions = [16, 32, 48, 256];
    const pngBuffers = [];

    for (const size of resolutions) {
      const buffer = await sharp(svgPath)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push(buffer);
    }

    // Header size (6 bytes) + Directory size (16 bytes per entry * number of entries)
    const headerSize = 6;
    const entrySize = 16;
    const directorySize = resolutions.length * entrySize;
    const totalHeaderSize = headerSize + directorySize;

    // Allocate buffer for header and directory entries
    const icoHeader = Buffer.alloc(totalHeaderSize);
    
    // Write ICO Header
    icoHeader.writeUInt16LE(0, 0);                 // Reserved (must be 0)
    icoHeader.writeUInt16LE(1, 2);                 // Type (1 = ICO)
    icoHeader.writeUInt16LE(resolutions.length, 4); // Number of images in file

    let currentOffset = totalHeaderSize;

    // Write Directory Entries
    for (let i = 0; i < resolutions.length; i++) {
      const size = resolutions[i];
      const pngBuffer = pngBuffers[i];
      const entryOffset = headerSize + i * entrySize;

      // 0 means 256 in ICO width/height byte definitions
      const displaySize = size === 256 ? 0 : size;

      icoHeader.writeUInt8(displaySize, entryOffset);           // Width
      icoHeader.writeUInt8(displaySize, entryOffset + 1);       // Height
      icoHeader.writeUInt8(0, entryOffset + 2);                 // Color count (0 = no palette)
      icoHeader.writeUInt8(0, entryOffset + 3);                 // Reserved
      icoHeader.writeUInt16LE(1, entryOffset + 4);              // Color planes (1)
      icoHeader.writeUInt16LE(32, entryOffset + 6);             // Bits per pixel (32)
      icoHeader.writeUInt32LE(pngBuffer.length, entryOffset + 8); // Size of image data in bytes
      icoHeader.writeUInt32LE(currentOffset, entryOffset + 12);  // Offset of image data from beginning of file

      currentOffset += pngBuffer.length;
    }

    // Concatenate header and all PNG images
    const icoBuffer = Buffer.concat([icoHeader, ...pngBuffers]);
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('[Icon Helper] Successfully generated ' + icoPath);
  } catch (err) {
    console.error('[Icon Helper] Error generating icons:', err);
    process.exit(1);
  }
}

generateIcons();
