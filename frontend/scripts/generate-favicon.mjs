import fs from 'fs';
import path from 'path';

// Generate a 32x32 RGBA pixel buffer
const width = 32;
const height = 32;
const pixels = new Uint8Array(width * height * 4); // RGBA

// Colors
const BG_R = 0x00, BG_G = 0x3b, BG_B = 0xe2, BG_A = 255; // #003be2
const FG_R = 0xd6, FG_G = 0xfd, FG_B = 0x04, FG_A = 255; // #d6fd04
const WHITE_R = 0xff, WHITE_G = 0xff, WHITE_B = 0xff, WHITE_A = 255;

// Draw rounded rect helper
function inRoundedRect(x, y, w, h, r) {
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  if (x < r && y < r) return (x - r) ** 2 + (y - r) ** 2 <= r ** 2;
  if (x >= w - r && y < r) return (x - (w - r - 1)) ** 2 + (y - r) ** 2 <= r ** 2;
  if (x < r && y >= h - r) return (x - r) ** 2 + (y - (h - r - 1)) ** 2 <= r ** 2;
  if (x >= w - r && y >= h - r) return (x - (w - r - 1)) ** 2 + (y - (h - r - 1)) ** 2 <= r ** 2;
  return true;
}

// Draw the icon onto 32x32
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    if (inRoundedRect(x, y, width, height, 7)) {
      pixels[idx] = BG_R;
      pixels[idx + 1] = BG_G;
      pixels[idx + 2] = BG_B;
      pixels[idx + 3] = BG_A;
    } else {
      pixels[idx + 3] = 0; // transparent
    }
  }
}

// Draw shopping bag shape onto pixels
// Bag coordinates (centered):
// Bag body: x from 9 to 22, y from 13 to 24
for (let y = 13; y <= 24; y++) {
  for (let x = 9; x <= 22; x++) {
    // Trapezoid body
    const topInset = y < 15 ? 1 : 0;
    if (x >= 9 + topInset && x <= 22 - topInset) {
      const idx = (y * width + x) * 4;
      // Outline of bag
      const isBorder = (x === 9 + topInset || x === 22 - topInset || y === 13 || y === 24);
      if (isBorder) {
        pixels[idx] = FG_R;
        pixels[idx + 1] = FG_G;
        pixels[idx + 2] = FG_B;
        pixels[idx + 3] = FG_A;
      }
    }
  }
}

// Bag handle loop (y from 8 to 15, x around 12 to 19)
for (let y = 8; y <= 15; y++) {
  for (let x = 12; x <= 19; x++) {
    const isHandle = (
      ((x === 13 || x === 14 || x === 17 || x === 18) && y >= 9 && y <= 15) ||
      (y === 8 && x >= 14 && x <= 17) ||
      (y === 9 && (x === 13 || x === 18))
    );
    if (isHandle) {
      const idx = (y * width + x) * 4;
      pixels[idx] = FG_R;
      pixels[idx + 1] = FG_G;
      pixels[idx + 2] = FG_B;
      pixels[idx + 3] = FG_A;
    }
  }
}

// Convert to ICO buffer (BMP format)
function createIco(width, height, rgbaPixels) {
  const bmpHeaderSize = 40;
  const pixelDataSize = width * height * 4;
  const maskRowSize = Math.ceil(width / 32) * 4;
  const maskSize = maskRowSize * height;
  const imageSize = bmpHeaderSize + pixelDataSize + maskSize;
  const totalFileSize = 6 + 16 + imageSize;

  const buffer = Buffer.alloc(totalFileSize);

  // 1. ICO Header
  buffer.writeUInt16LE(0, 0); // Reserved
  buffer.writeUInt16LE(1, 2); // ICO type
  buffer.writeUInt16LE(1, 4); // 1 image

  // 2. Directory Entry
  buffer.writeUInt8(width, 6);
  buffer.writeUInt8(height, 7);
  buffer.writeUInt8(0, 8); // Color count
  buffer.writeUInt8(0, 9); // Reserved
  buffer.writeUInt16LE(1, 10); // Color planes
  buffer.writeUInt16LE(32, 12); // Bits per pixel
  buffer.writeUInt32LE(imageSize, 14); // Image size
  buffer.writeUInt32LE(22, 18); // Offset (6 + 16 = 22)

  // 3. BITMAPINFOHEADER (at offset 22)
  let offset = 22;
  buffer.writeUInt32LE(bmpHeaderSize, offset);
  buffer.writeInt32LE(width, offset + 4);
  buffer.writeInt32LE(height * 2, offset + 8); // Height * 2 for ICO
  buffer.writeUInt16LE(1, offset + 12); // Planes
  buffer.writeUInt16LE(32, offset + 14); // 32 bpp
  buffer.writeUInt32LE(0, offset + 16); // BI_RGB (uncompressed)
  buffer.writeUInt32LE(pixelDataSize + maskSize, offset + 20); // Image size
  buffer.writeInt32LE(0, offset + 24); // X pixels/m
  buffer.writeInt32LE(0, offset + 28); // Y pixels/m
  buffer.writeUInt32LE(0, offset + 32); // Colors used
  buffer.writeUInt32LE(0, offset + 36); // Important colors

  // 4. Pixel data (Bottom to Top, BGRA format)
  offset += bmpHeaderSize;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const b = rgbaPixels[srcIdx + 2];
      const g = rgbaPixels[srcIdx + 1];
      const r = rgbaPixels[srcIdx];
      const a = rgbaPixels[srcIdx + 3];

      buffer.writeUInt8(b, offset);
      buffer.writeUInt8(g, offset + 1);
      buffer.writeUInt8(r, offset + 2);
      buffer.writeUInt8(a, offset + 3);
      offset += 4;
    }
  }

  // 5. AND mask (1 bit per pixel, 0 = opaque/transparent determined by alpha channel)
  buffer.fill(0, offset, offset + maskSize);

  return buffer;
}

const icoBuffer = createIco(width, height, pixels);

// Write to frontend locations
fs.writeFileSync('e:/single-vendor/frontend/src/app/favicon.ico', icoBuffer);
fs.writeFileSync('e:/single-vendor/frontend/public/favicon.ico', icoBuffer);
console.log('Successfully generated favicon.ico (32x32 32-bit ICO)');
