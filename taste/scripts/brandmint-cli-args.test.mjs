// brandmint-cli-args.test.mjs — the brandmint CLI argument parser (parseArgs).
//
// Extracted from main() so the CLI defaults are unit-testable. The headline contract: reroll is ON BY
// DEFAULT (the flow self-corrects every render) and is opted out with --no-reroll. PURE: argv in →
// options out, no I/O.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from './brandmint.mjs';

test('parseArgs: defaults — reroll ON, images ON, coverage @ 0.12, 2 attempts', () => {
  const o = parseArgs(['spec.json', 'out']);
  assert.equal(o.specPath, 'spec.json');
  assert.equal(o.outDir, 'out');
  assert.equal(o.images, true);
  assert.equal(o.reroll, true, 'reroll defaults ON (opt-out)');
  assert.equal(o.threshold, 0.12);
  assert.equal(o.maxAttempts, 2);
  assert.equal(o.metric, 'coverage');
  assert.ok(o.skillDir.endsWith('gpt-image-2'), 'a sensible default skillDir');
});

test('parseArgs: --no-reroll opts out of self-correction', () => {
  assert.equal(parseArgs(['s', 'o', '--no-reroll']).reroll, false);
});

test('parseArgs: --reroll is harmless (default is already on)', () => {
  assert.equal(parseArgs(['s', 'o', '--reroll']).reroll, true);
});

test('parseArgs: --no-images disables the generative half', () => {
  assert.equal(parseArgs(['s', 'o', '--no-images']).images, false);
});

test('parseArgs: --threshold / --max-attempts / --metric are read', () => {
  const o = parseArgs(['s', 'o', '--threshold', '0.3', '--max-attempts', '3', '--metric', 'accentPresence']);
  assert.equal(o.threshold, 0.3);
  assert.equal(o.maxAttempts, 3);
  assert.equal(o.metric, 'accentPresence');
});

test('parseArgs: --skill-dir overrides the default', () => {
  assert.equal(parseArgs(['s', 'o', '--skill-dir', '/custom/skill']).skillDir, '/custom/skill');
});

test('parseArgs: positionals are captured regardless of flag position', () => {
  const o = parseArgs(['--no-reroll', 'spec.json', '--threshold', '0.2', 'outDir']);
  assert.equal(o.specPath, 'spec.json');
  assert.equal(o.outDir, 'outDir');
  assert.equal(o.reroll, false);
  assert.equal(o.threshold, 0.2);
});

test('parseArgs: missing positionals come back undefined (main() enforces usage)', () => {
  const o = parseArgs([]);
  assert.equal(o.specPath, undefined);
  assert.equal(o.outDir, undefined);
});

test('parseArgs: backend defaults to gpt-image', () => {
  assert.equal(parseArgs(['s', 'o']).backend, 'gpt-image');
});

test('parseArgs: --backend nanobanana selects the Gemini lane', () => {
  assert.equal(parseArgs(['s', 'o', '--backend', 'nanobanana']).backend, 'nanobanana');
});

test('parseArgs: --nano-script overrides the default generate.py path', () => {
  const o = parseArgs(['s', 'o', '--nano-script', '/x/generate.py']);
  assert.equal(o.nanoScript, '/x/generate.py');
});
