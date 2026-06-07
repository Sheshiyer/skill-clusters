// gpt-image.test.mjs — RED-first contract for the gpt-image-2 adapter (lib/gpt-image.mjs).
//
// The adapter is the brandmint wing's bridge to the gpt-image-2 skill's `scripts/gen.sh`
// (image generation through the user's ChatGPT subscription via codex — no per-image spend).
// Two surfaces:
//   buildGenArgs({skillDir,prompt,out,refs,timeoutSec})  -> argv for `bash <gen.sh> ...` (PURE)
//   makeGptImage({skillDir,runner}).generateImage({...}) -> {ok,out,code} (runner injected)
// Tests inject a fake runner so nothing shells out / calls codex here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGenArgs, makeGptImage } from './gpt-image.mjs';

const SKILL = '/skills/gpt-image-2';
const GEN = `${SKILL}/scripts/gen.sh`;

// --- buildGenArgs (pure argv construction) ---------------------------------

test('buildGenArgs: first element is the gen.sh path under skillDir', () => {
  const argv = buildGenArgs({ skillDir: SKILL, prompt: 'a cat', out: '/tmp/c.png' });
  assert.equal(argv[0], GEN);
});

test('buildGenArgs: includes --prompt immediately followed by the prompt', () => {
  const argv = buildGenArgs({ skillDir: SKILL, prompt: 'a red cat', out: '/tmp/c.png' });
  const i = argv.indexOf('--prompt');
  assert.ok(i >= 0, 'has --prompt');
  assert.equal(argv[i + 1], 'a red cat');
});

test('buildGenArgs: includes --out immediately followed by the output path', () => {
  const argv = buildGenArgs({ skillDir: SKILL, prompt: 'x', out: '/tmp/out.png' });
  const i = argv.indexOf('--out');
  assert.ok(i >= 0, 'has --out');
  assert.equal(argv[i + 1], '/tmp/out.png');
});

test('buildGenArgs: appends one --ref <path> pair per reference image, in order', () => {
  const argv = buildGenArgs({
    skillDir: SKILL, prompt: 'x', out: '/tmp/o.png',
    refs: ['/a.png', '/b.png'],
  });
  // collect the value after each --ref occurrence
  const refs = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--ref') refs.push(argv[i + 1]);
  assert.deepEqual(refs, ['/a.png', '/b.png']);
});

test('buildGenArgs: includes --timeout-sec as a string when provided', () => {
  const argv = buildGenArgs({ skillDir: SKILL, prompt: 'x', out: '/tmp/o.png', timeoutSec: 240 });
  const i = argv.indexOf('--timeout-sec');
  assert.ok(i >= 0, 'has --timeout-sec');
  assert.equal(argv[i + 1], '240');
});

test('buildGenArgs: emits no --ref token when refs is empty/omitted', () => {
  const argv = buildGenArgs({ skillDir: SKILL, prompt: 'x', out: '/tmp/o.png' });
  assert.ok(!argv.includes('--ref'));
});

// --- makeGptImage.generateImage (injected runner) --------------------------

// A fake runner mirroring child_process.spawnSync's shape: returns { status }.
function fakeRunner(status, sink) {
  return (argv) => { if (sink) sink.argv = argv; return { status }; };
}

test('generateImage: throws when prompt is empty', () => {
  const g = makeGptImage({ skillDir: SKILL, runner: fakeRunner(0) });
  assert.throws(() => g.generateImage({ prompt: '', out: '/tmp/o.png' }));
});

test('generateImage: throws when out is empty', () => {
  const g = makeGptImage({ skillDir: SKILL, runner: fakeRunner(0) });
  assert.throws(() => g.generateImage({ prompt: 'x', out: '' }));
});

test('generateImage: calls the injected runner with the built argv', () => {
  const sink = {};
  const g = makeGptImage({ skillDir: SKILL, runner: fakeRunner(0, sink) });
  g.generateImage({ prompt: 'a cat', out: '/tmp/c.png', refs: ['/r.png'] });
  assert.equal(sink.argv[0], GEN);
  assert.equal(sink.argv[sink.argv.indexOf('--prompt') + 1], 'a cat');
  assert.equal(sink.argv[sink.argv.indexOf('--out') + 1], '/tmp/c.png');
  assert.equal(sink.argv[sink.argv.indexOf('--ref') + 1], '/r.png');
});

test('generateImage: returns {ok:true,out} when the runner exits 0', () => {
  const g = makeGptImage({ skillDir: SKILL, runner: fakeRunner(0) });
  const r = g.generateImage({ prompt: 'x', out: '/tmp/o.png' });
  assert.equal(r.ok, true);
  assert.equal(r.out, '/tmp/o.png');
});

test('generateImage: returns {ok:false,code} when the runner exits nonzero', () => {
  const g = makeGptImage({ skillDir: SKILL, runner: fakeRunner(7) });
  const r = g.generateImage({ prompt: 'x', out: '/tmp/o.png' });
  assert.equal(r.ok, false);
  assert.equal(r.code, 7);
});
