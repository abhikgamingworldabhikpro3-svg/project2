import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function tutorFlowPixel(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Squircle corner clipping for non-maskable icons
  const cornerRadius = isMaskable ? 0 : 0.22;
  const dx = Math.abs(nx - 0.5);
  const dy = Math.abs(ny - 0.5);

  if (!isMaskable) {
    const rx = 0.5 - cornerRadius;
    const ry = 0.5 - cornerRadius;
    if (dx > rx && dy > ry) {
      const dist = Math.hypot(dx - rx, dy - ry);
      if (dist > cornerRadius) {
        return [0, 0, 0, 0];
      }
    }
  }

  // Deep Indigo/Royal Blue Gradient (#312E81 -> #4F46E5 -> #0284C7)
  const t = (nx * 0.4 + ny * 0.6);
  const r = Math.round(49 * (1 - t) + 2 * t);
  const g = Math.round(46 * (1 - t) + 132 * t);
  const b = Math.round(129 * (1 - t) + 199 * t);

  // Normalized coordinates centered at (0, 0)
  const cx = (nx - 0.5) * 2;
  const cy = (ny - 0.5) * 2;

  // Cap Diamond: |cx| / 0.62 + |cy + 0.22| / 0.22 <= 1.0
  const capDist = Math.abs(cx) / 0.62 + Math.abs(cy + 0.22) / 0.22;
  if (capDist <= 1.0) {
    if (capDist <= 0.88) {
      return [255, 255, 255, 255]; // Crisp diamond surface
    }
    return [224, 231, 255, 255]; // Soft rim shadow
  }

  // Cap under-rim arc
  if (cy > -0.15 && cy < 0.12 && Math.abs(cx) < 0.38) {
    const arc = (cx * cx) / (0.38 * 0.38) + ((cy - 0.12) * (cy - 0.12)) / (0.18 * 0.18);
    if (arc <= 1.0) {
      return [238, 242, 255, 255];
    }
  }

  // Gold Tassel dot
  const tDx = cx - 0.52;
  const tDy = cy + 0.05;
  if (tDx * tDx + tDy * tDy < 0.06 * 0.06) {
    return [245, 158, 11, 255]; // Vivid gold
  }

  // Book Pages / Flow Waves below
  if (cy > 0.12 && cy < 0.62) {
    const pageT = (cy - 0.12) / 0.5;
    const pageW = 0.68 - 0.14 * pageT;
    if (Math.abs(cx) < pageW) {
      if (Math.abs(cx) < 0.05) {
        return [56, 189, 248, 255]; // Cyan spine highlight
      }
      return [255, 255, 255, 255]; // Pure white pages
    }
  }

  return [r, g, b, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => tutorFlowPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => tutorFlowPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => tutorFlowPixel(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => tutorFlowPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createPNG(32, 32, (x, y, w, h) => tutorFlowPixel(x, y, w, h, false)));

console.log('Regenerated pristine TutorFlow icons!');
