/**
 * Generates build/icon.png (512x512) for electron-builder Windows packaging.
 * Pure-Node PNG encoder (zlib built-in) — no native canvas required.
 * Design: rounded-square amber/rose gradient, white music note, play-triangle cutout.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 512;
const data = Buffer.alloc(SIZE * SIZE * 4); // RGBA

const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// --- helpers ---------------------------------------------------------------
function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

function fillEllipse(cx, cy, rx, ry, color, rot = 0) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d <= 1) {
        let px = x, py = y;
        if (rot) {
          const c = Math.cos(rot), s = Math.sin(rot);
          px = x * c - y * s;
          py = x * s + y * c;
        }
        setPixel(cx + px, cy + py, ...color);
      }
    }
  }
}

function fillRect(x0, y0, x1, y1, color, radius = 0) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (radius > 0) {
        const nx = clamp(x < x0 + radius ? x0 + radius - x : x > x1 - radius ? x - (x1 - radius) : 0, 0, radius);
        const ny = clamp(y < y0 + radius ? y0 + radius - y : y > y1 - radius ? y - (y1 - radius) : 0, 0, radius);
        if (nx * nx + ny * ny > radius * radius) continue;
      }
      setPixel(x, y, ...color);
    }
  }
}

// --- background: rounded square with vertical amber->rose gradient ---------
const ROUND = 96;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // rounded corner mask
    const cx = clamp(x, ROUND, SIZE - ROUND - 1);
    const cy = clamp(y, ROUND, SIZE - ROUND - 1);
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy > ROUND * ROUND) continue;

    const t = y / SIZE;
    // top: #F59E0B (amber), bottom: #E11D48 (rose)
    const r = lerp(245, 225, t);
    const g = lerp(158, 29, t);
    const b = lerp(11, 72, t);
    setPixel(x, y, r, g, b);
  }
}

// --- play-triangle cutout (dark translucent) -------------------------------
const tc = { x: 256, y: 258 };
const TR = 150;
for (let y = tc.y - TR; y <= tc.y + TR; y++) {
  const span = (TR - Math.abs(y - tc.y)) * 0.85;
  for (let x = tc.x - span; x <= tc.x + span; x++) {
    const dx = x - tc.x, dy = y - tc.y;
    if (dx * dx + dy * dy <= TR * TR) {
      // keep only points inside the triangle
      const inTri = y >= tc.y - TR && y <= tc.y + TR &&
        x >= tc.x - span * 0.9 && x <= tc.x + span * 0.9 &&
        (x - tc.x) / span >= -0.9;
      if (!inTri) continue;
      const i = (y * SIZE + x) * 4;
      const t = data[i + 3] / 255;
      // blend dark overlay
      data[i] = lerp(data[i], 20, 0.35);
      data[i + 1] = lerp(data[i + 1], 12, 0.35);
      data[i + 2] = lerp(data[i + 2], 24, 0.35);
    }
  }
}

// --- white music note glyph -------------------------------------------------
const WHITE = [255, 255, 255];
// beam (two rounded bars, slightly angled)
fillRect(128, 120, 380, 160, WHITE, 16);
fillRect(150, 106, 402, 146, WHITE, 16);
// stem
fillRect(300, 150, 332, 340, WHITE, 10);
// note head (ellipse, tilted)
fillEllipse(316, 368, 72, 54, WHITE, -0.42);

// --- encode PNG ------------------------------------------------------------
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, payload])));
  return Buffer.concat([len, typeBuf, payload, crcBuf]);
}

// raw RGBA scanlines with filter byte 0
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  data.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const outDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'icon.png');
fs.writeFileSync(outPath, png);
console.log(`Generated ${outPath} (${png.length} bytes)`);

// --- ICO container (PNG-in-ICO, Vista+) ------------------------------------
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type: icon
icoHeader.writeUInt16LE(1, 4); // image count

const entry = Buffer.alloc(16);
entry[0] = 0; // width 256 (0 means 256)
entry[1] = 0; // height 256
entry[2] = 0; // palette
entry[3] = 0; // reserved
entry.writeUInt16LE(1, 4);  // planes
entry.writeUInt16LE(32, 6); // bpp
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12); // offset

const ico = Buffer.concat([icoHeader, entry, png]);
const icoPath = path.join(outDir, 'icon.ico');
fs.writeFileSync(icoPath, ico);
console.log(`Generated ${icoPath} (${ico.length} bytes)`);