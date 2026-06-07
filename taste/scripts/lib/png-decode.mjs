// png-decode.mjs — a minimal, zero-dependency PNG decoder for the on-brand raster scorer.
//
//   decodePng(buffer) -> { width, height, channels: 3, pixels: Uint8Array }   // RGB, row-major
//
// WHY THIS EXISTS: the taste pipeline renders brand kits to PNG, and kit-qa needs raw RGB pixels to
// measure how on-palette a render is — without pulling in sharp/pngjs/canvas (a hard rule: only
// node: builtins). PNG is, for the truecolor-8-bit case we render, simple enough to decode by hand:
// a signature, a stream of [length|type|data|crc] chunks, an IHDR header, one-or-more zlib-compressed
// IDAT blocks of filtered scanlines, and an IEND. We inflate the IDATs (node:zlib), then reverse the
// per-scanline PNG filter (None/Sub/Up/Average/Paeth) to recover the pixels.
//
// DELIBERATELY NARROW: we support ONLY colorType 2 (truecolor RGB), bitDepth 8, interlace 0 — exactly
// what the renderers emit. Palette (3), grayscale (0), any alpha type, 16-bit, or Adam7-interlaced
// input throws a clear Error rather than silently mis-decoding. CRCs are SKIPPED (not validated) on
// purpose: we trust our own pipeline's bytes and skipping keeps the decoder tiny.
//
// PURE: decodePng reads only its input Buffer and returns a fresh object; no I/O, no globals, no
// mutation of the input. File reads live in the CLI (kit-qa.mjs), never here.

import zlib from 'node:zlib';

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]; // "\x89PNG\r\n\x1a\n"
const BYTES_PER_PIXEL = 3; // truecolor RGB, 8-bit

// Paeth predictor (PNG spec §6.6): choose the neighbor (left a, up b, up-left c) closest to p=a+b-c.
function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

// Parse the IHDR data block (13 bytes): dims + bit depth + color type + interlace.
function readIhdr(data) {
  return {
    width: data.readUInt32BE(0),
    height: data.readUInt32BE(4),
    bitDepth: data[8],
    colorType: data[9],
    // data[10] compression, data[11] filter method — always 0 in valid PNGs; not load-bearing here.
    interlace: data[12],
  };
}

// ── decodePng (PURE) ─────────────────────────────────────────────────────────────────────────────
export function decodePng(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // 1. Signature — the first 8 bytes must be the exact PNG magic.
  if (buf.length < 8) throw new Error('not a PNG: buffer too short for signature');
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== SIGNATURE[i]) throw new Error('not a PNG: bad signature');
  }

  // 2. Walk chunks: [length(4 BE) | type(4 ascii) | data(length) | crc(4, SKIPPED)].
  let offset = 8;
  let header = null;
  const idatParts = [];
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const data = buf.subarray(dataStart, dataStart + length);

    if (type === 'IHDR') header = readIhdr(data);
    else if (type === 'IDAT') idatParts.push(data);
    else if (type === 'IEND') break;

    offset = dataStart + length + 4; // + 4 skips the CRC we never check
  }

  if (!header) throw new Error('invalid PNG: missing IHDR chunk');

  // 3. Format gate — we only decode truecolor RGB / 8-bit / non-interlaced.
  const { width, height, bitDepth, colorType, interlace } = header;
  if (colorType !== 2) {
    throw new Error(
      `unsupported PNG color type ${colorType} (only 2 = truecolor RGB is supported; ` +
      `0=grayscale, 3=palette, 4/6=alpha are not)`,
    );
  }
  if (bitDepth !== 8) throw new Error(`unsupported PNG bit depth ${bitDepth} (only 8 is supported)`);
  if (interlace !== 0) throw new Error(`unsupported interlaced PNG (interlace ${interlace}; only 0)`);
  if (idatParts.length === 0) throw new Error('invalid PNG: no IDAT data');

  // 4. Inflate the concatenated IDAT stream → filtered scanlines.
  const raw = zlib.inflateSync(Buffer.concat(idatParts));

  // 5. Un-filter scanlines. Each row is [filterByte, ...stride bytes]; reconstruct in place.
  const stride = width * BYTES_PER_PIXEL;
  const pixels = new Uint8Array(width * height * BYTES_PER_PIXEL);
  const expected = height * (stride + 1);
  if (raw.length < expected) {
    throw new Error(`invalid PNG: inflated data ${raw.length} bytes, expected ${expected}`);
  }

  let rawPos = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[rawPos++];
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride; // valid only when y > 0

    for (let i = 0; i < stride; i++) {
      const x = raw[rawPos++];                                   // filtered byte
      const a = i >= BYTES_PER_PIXEL ? pixels[rowStart + i - BYTES_PER_PIXEL] : 0; // left
      const b = y > 0 ? pixels[prevStart + i] : 0;               // up
      const c = (y > 0 && i >= BYTES_PER_PIXEL) ? pixels[prevStart + i - BYTES_PER_PIXEL] : 0; // up-left

      let value;
      switch (filterType) {
        case 0: value = x; break;                                // None
        case 1: value = x + a; break;                            // Sub
        case 2: value = x + b; break;                            // Up
        case 3: value = x + Math.floor((a + b) / 2); break;      // Average
        case 4: value = x + paethPredictor(a, b, c); break;      // Paeth
        default: throw new Error(`invalid PNG: unknown filter type ${filterType} at row ${y}`);
      }
      pixels[rowStart + i] = value & 0xff;
    }
  }

  return { width, height, channels: BYTES_PER_PIXEL, pixels };
}
