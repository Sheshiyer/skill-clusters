// png-decode.test.mjs — round-trips a zero-dependency PNG decoder across ALL 5 filter types.
// Run: node --test taste/scripts/lib/png-decode.test.mjs
//
// STRATEGY: there is no PNG fixture on disk, so the test SHIPS ITS OWN ENCODER. The encoder is the
// mirror image of the decoder — it applies the same PNG filter (None/Sub/Up/Average/Paeth) the
// decoder reverses — then we assert the decoded RGB equals the ORIGINAL UNFILTERED pixels. That is
// the whole point: if the encoder emitted filter-0 rows for every case, the decoder's Sub/Up/Average/
// Paeth branches would never run and the filter tests would be theater. By filtering on the way in
// and asserting on the original pixels on the way out, each filter's reverse path is genuinely exercised.
//
// The encoder writes dummy/zero CRCs because the decoder skips CRCs (per spec). One IDAT, deflateSync'd.

import { test } from 'node:test';
import assert from 'node:assert';
import zlib from 'node:zlib';

import { decodePng } from './png-decode.mjs';

// --- in-test PNG ENCODER ---------------------------------------------------------------------------

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature

// One PNG chunk: length(4 BE) | type(4 ascii) | data | crc(4, zeroed — decoder skips it).
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  return Buffer.concat([len, Buffer.from(type, 'ascii'), data, Buffer.alloc(4)]); // crc = 0000
}

// IHDR data block. colorType defaults to 2 (truecolor RGB), bitDepth 8, interlace 0.
function ihdr(width, height, { bitDepth = 8, colorType = 2, interlace = 0 } = {}) {
  const d = Buffer.alloc(13);
  d.writeUInt32BE(width, 0);
  d.writeUInt32BE(height, 4);
  d[8] = bitDepth;
  d[9] = colorType;
  d[10] = 0; // compression
  d[11] = 0; // filter method
  d[12] = interlace;
  return d;
}

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
};

// Apply ONE filter type to a single scanline (bytesPerPixel=3). prevRow may be null (first row).
// `row` and `prevRow` are raw RGB byte arrays of length width*3. Returns the filtered bytes.
function filterRow(row, prevRow, type) {
  const bpp = 3;
  const out = new Uint8Array(row.length);
  for (let i = 0; i < row.length; i++) {
    const a = i >= bpp ? row[i - bpp] : 0;          // left
    const b = prevRow ? prevRow[i] : 0;             // up
    const c = prevRow && i >= bpp ? prevRow[i - bpp] : 0; // up-left
    let v;
    switch (type) {
      case 0: v = row[i]; break;
      case 1: v = row[i] - a; break;
      case 2: v = row[i] - b; break;
      case 3: v = row[i] - Math.floor((a + b) / 2); break;
      case 4: v = row[i] - paeth(a, b, c); break;
      default: throw new Error(`bad filter ${type}`);
    }
    out[i] = v & 0xff;
  }
  return out;
}

// Encode RGB rows (array of width*3-length byte arrays) into a full PNG buffer, filtering EVERY row
// with `filterType`. This is what makes the decoder's reverse-filter branch run.
function encodePng(width, height, rgbRows, filterType, ihdrOpts = {}) {
  const stride = width * 3;
  const raw = [];
  let prev = null;
  for (let y = 0; y < height; y++) {
    const row = Uint8Array.from(rgbRows[y]);
    raw.push(filterType); // leading filter byte
    const filtered = filterRow(row, prev, filterType);
    for (let i = 0; i < stride; i++) raw.push(filtered[i]);
    prev = row;
  }
  const idat = zlib.deflateSync(Buffer.from(raw));
  return Buffer.concat([
    SIG,
    chunk('IHDR', ihdr(width, height, ihdrOpts)),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Flatten array-of-rows into the expected width*height*3 RGB sequence for comparison.
const flatten = (rows) => Uint8Array.from(rows.flat());

// --- fixtures --------------------------------------------------------------------------------------

// A 2x2 image with four distinct colors so left/up/up-left all differ (exercises every predictor).
const IMG_2x2 = [
  [10, 20, 30, 200, 100, 50],   // row 0: (10,20,30) (200,100,50)
  [60, 70, 80, 5, 250, 130],    // row 1: (60,70,80) (5,250,130)
];

// A 3x1 image (single row → Up/Average/Paeth see no prev row, exercise the first-row path).
const IMG_3x1 = [
  [9, 8, 7, 100, 110, 120, 240, 0, 17], // 3 pixels in one row
];

// --- decoder shape ---------------------------------------------------------------------------------

test('decodePng returns { width, height, channels:3, pixels } RGB row-major', () => {
  const png = encodePng(2, 2, IMG_2x2, 0);
  const out = decodePng(png);
  assert.equal(out.width, 2);
  assert.equal(out.height, 2);
  assert.equal(out.channels, 3);
  assert.ok(out.pixels instanceof Uint8Array, 'pixels is a Uint8Array');
  assert.equal(out.pixels.length, 2 * 2 * 3, 'pixels length is width*height*3');
});

// --- round-trip across EVERY filter type -----------------------------------------------------------

for (const [name, type] of [['None', 0], ['Sub', 1], ['Up', 2], ['Average', 3], ['Paeth', 4]]) {
  test(`filter ${type} (${name}) round-trips exact RGB on a 2x2 image`, () => {
    const png = encodePng(2, 2, IMG_2x2, type);
    const out = decodePng(png);
    assert.deepEqual(Array.from(out.pixels), Array.from(flatten(IMG_2x2)));
  });

  test(`filter ${type} (${name}) round-trips exact RGB on a 3x1 image`, () => {
    const png = encodePng(3, 1, IMG_3x1, type);
    const out = decodePng(png);
    assert.deepEqual(Array.from(out.pixels), Array.from(flatten(IMG_3x1)));
  });
}

// --- rejection of unsupported formats --------------------------------------------------------------

test('throws a clear Error on colorType 3 (palette) IHDR', () => {
  // Hand-build a minimal palette-colorType PNG header; the IDAT content is irrelevant — the decoder
  // must reject before/at IHDR interpretation.
  const png = Buffer.concat([
    SIG,
    chunk('IHDR', ihdr(2, 2, { colorType: 3 })),
    chunk('IDAT', zlib.deflateSync(Buffer.from([0, 0, 0, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  assert.throws(() => decodePng(png), /colou?r|palette|type|support/i);
});

test('throws on a non-PNG signature', () => {
  const notPng = Buffer.from('this is definitely not a png file at all');
  assert.throws(() => decodePng(notPng), /signature|png/i);
});
