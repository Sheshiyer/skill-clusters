// brandmint-pack.test.mjs — RED-first contract for the asset-pack manifest (brandmint-pack.mjs).
//
// brandmint-pack turns a list of kit files into a content-addressed manifest: one entry per file
// with its byte length + sha256, plus aggregate count + totalBytes. Its pure core takes injected
// readBytes + sha256 so the test never touches disk or node:crypto. One surface under test:
//   packKit({files, readBytes, sha256}) -> { count, totalBytes, files:[{path,bytes,sha256}] }
// The CLI (not exercised here) walks a kitDir, reads real bytes, and hashes via node:crypto.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packKit } from './brandmint-pack.mjs';

// A fake file system: path -> string contents. readBytes returns a Buffer (so .length is the byte
// count); sha256 is a deterministic stub keyed off the bytes so we can assert it lands on each entry.
const FILES_CONTENT = {
  'brand-spec.json': '{"brand":"x"}',          // 13 bytes
  'logo.svg': '<svg></svg>',                    // 11 bytes
  'images/board.png': 'PNGDATA',                // 7 bytes
};
const PATHS = Object.keys(FILES_CONTENT);

function harness() {
  const readCalls = [];
  const sha256Calls = [];
  const readBytes = (p) => { readCalls.push(p); return Buffer.from(FILES_CONTENT[p]); };
  const sha256 = (bytes) => { sha256Calls.push(bytes); return `sha-${bytes.length}`; };
  return { readCalls, sha256Calls, readBytes, sha256 };
}

test('packKit: count equals the number of input files', () => {
  const h = harness();
  const m = packKit({ files: PATHS, readBytes: h.readBytes, sha256: h.sha256 });
  assert.equal(m.count, PATHS.length);
});

test('packKit: one files[] entry per input path, in order', () => {
  const h = harness();
  const m = packKit({ files: PATHS, readBytes: h.readBytes, sha256: h.sha256 });
  assert.equal(m.files.length, PATHS.length);
  assert.deepEqual(m.files.map((f) => f.path), PATHS);
});

test('packKit: each entry has a numeric byte length from readBytes', () => {
  const h = harness();
  const m = packKit({ files: PATHS, readBytes: h.readBytes, sha256: h.sha256 });
  assert.deepEqual(m.files.map((f) => f.bytes), [13, 11, 7]);
  for (const f of m.files) assert.equal(typeof f.bytes, 'number');
});

test('packKit: each entry carries the injected sha256 string', () => {
  const h = harness();
  const m = packKit({ files: PATHS, readBytes: h.readBytes, sha256: h.sha256 });
  assert.deepEqual(m.files.map((f) => f.sha256), ['sha-13', 'sha-11', 'sha-7']);
  for (const f of m.files) assert.equal(typeof f.sha256, 'string');
});

test('packKit: totalBytes is the sum of every entry byte length', () => {
  const h = harness();
  const m = packKit({ files: PATHS, readBytes: h.readBytes, sha256: h.sha256 });
  assert.equal(m.totalBytes, 13 + 11 + 7);
});

test('packKit: reads + hashes each file exactly once', () => {
  const h = harness();
  packKit({ files: PATHS, readBytes: h.readBytes, sha256: h.sha256 });
  assert.equal(h.readCalls.length, PATHS.length);
  assert.equal(h.sha256Calls.length, PATHS.length);
});

test('packKit: empty file list yields count 0, totalBytes 0, no entries', () => {
  const h = harness();
  const m = packKit({ files: [], readBytes: h.readBytes, sha256: h.sha256 });
  assert.equal(m.count, 0);
  assert.equal(m.totalBytes, 0);
  assert.deepEqual(m.files, []);
});
