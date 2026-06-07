// brandmint-multi.test.mjs — RED-first contract for the multi-brand FAN-OUT (brandmint-multi.mjs).
//
// brandmint-multi runs the brandmint flow across N brands. Its pure core is a thin, deterministic
// fan-out — for each brand it invokes an INJECTED runKit({spec,outDir}) once and collects the
// returned manifest, in order. The CLI (not exercised here) wraps a real runKit around runBrandKit
// with real fs/console/gpt-image deps. One surface under test:
//   runMultiBrand({brands, runKit}) -> manifests[]   (runKit injected → no disk, no codex, no spend)
// Tests inject a recording runKit so nothing touches disk or shells out.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMultiBrand } from './brandmint-multi.mjs';

// Three fake brands. spec is opaque to runMultiBrand (it just forwards it), so a tiny stub is enough.
const BRANDS = [
  { name: 'alpha', spec: { brand: 'alpha' }, outDir: '/out/alpha' },
  { name: 'bravo', spec: { brand: 'bravo' }, outDir: '/out/bravo' },
  { name: 'charlie', spec: { brand: 'charlie' }, outDir: '/out/charlie' },
];

// A recording runKit: logs each call and returns a manifest tagged with the brand it saw, so the
// tests can assert call-count, order, and that spec/outDir were forwarded intact.
function recordingRunKit() {
  const calls = [];
  const runKit = ({ spec, outDir }) => {
    calls.push({ spec, outDir });
    return { brand: spec.brand, version: `v-${spec.brand}`, outDir };
  };
  return { calls, runKit };
}

test('runMultiBrand: calls runKit exactly once per brand', () => {
  const r = recordingRunKit();
  runMultiBrand({ brands: BRANDS, runKit: r.runKit });
  assert.equal(r.calls.length, BRANDS.length);
});

test('runMultiBrand: returns one manifest per brand, length == brands.length', () => {
  const r = recordingRunKit();
  const manifests = runMultiBrand({ brands: BRANDS, runKit: r.runKit });
  assert.ok(Array.isArray(manifests), 'returns an array');
  assert.equal(manifests.length, BRANDS.length);
});

test('runMultiBrand: preserves brand order in the returned manifests', () => {
  const r = recordingRunKit();
  const manifests = runMultiBrand({ brands: BRANDS, runKit: r.runKit });
  assert.deepEqual(manifests.map((m) => m.brand), ['alpha', 'bravo', 'charlie']);
});

test('runMultiBrand: forwards each brand spec and outDir to runKit, in order', () => {
  const r = recordingRunKit();
  runMultiBrand({ brands: BRANDS, runKit: r.runKit });
  assert.deepEqual(r.calls.map((c) => c.outDir), ['/out/alpha', '/out/bravo', '/out/charlie']);
  assert.deepEqual(r.calls.map((c) => c.spec.brand), ['alpha', 'bravo', 'charlie']);
});

test('runMultiBrand: collects the exact manifest each runKit returns', () => {
  const runKit = ({ spec, outDir }) => ({ brand: spec.brand, version: '123abc', outDir, extra: 1 });
  const manifests = runMultiBrand({ brands: BRANDS, runKit });
  for (const m of manifests) {
    assert.equal(m.version, '123abc');
    assert.equal(m.extra, 1);
  }
});

test('runMultiBrand: empty brands list yields an empty array, no runKit calls', () => {
  const r = recordingRunKit();
  const manifests = runMultiBrand({ brands: [], runKit: r.runKit });
  assert.deepEqual(manifests, []);
  assert.equal(r.calls.length, 0);
});
