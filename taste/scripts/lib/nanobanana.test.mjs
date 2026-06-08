// nanobanana.test.mjs — RED-first contract for the Nano Banana Pro adapter (lib/nanobanana.mjs).
//
// The sibling of gpt-image.mjs: a bridge to the nanobanana skill's scripts/generate.py (Gemini 3 Pro
// Image, via the GEMINI_API_KEY in the runner's env). Two surfaces:
//   buildNanoArgs({scriptPath,prompt,out,refs,size,ratio}) -> argv for `python3 generate.py …` (PURE)
//   makeNanoBanana({scriptPath,runner}).generateImage({…}) -> {ok,out,code} (runner injected)
// Tests inject a fake runner so nothing shells out / calls Gemini here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNanoArgs, makeNanoBanana } from './nanobanana.mjs';

const GEN = '/skills/nanobanana/scripts/generate.py';

test('buildNanoArgs: first element is the generate.py path', () => {
  assert.equal(buildNanoArgs({ scriptPath: GEN, prompt: 'a cat', out: '/tmp/c.png' })[0], GEN);
});

test('buildNanoArgs: the prompt is the positional immediately after the script', () => {
  assert.equal(buildNanoArgs({ scriptPath: GEN, prompt: 'a red cat', out: '/tmp/c.png' })[1], 'a red cat');
});

test('buildNanoArgs: includes -o then the output path', () => {
  const a = buildNanoArgs({ scriptPath: GEN, prompt: 'x', out: '/tmp/o.png' });
  assert.equal(a[a.indexOf('-o') + 1], '/tmp/o.png');
});

test('buildNanoArgs: includes -i <ref> when a reference image is given', () => {
  const a = buildNanoArgs({ scriptPath: GEN, prompt: 'x', out: '/o.png', refs: ['/ref.jpg'] });
  assert.equal(a[a.indexOf('-i') + 1], '/ref.jpg');
});

test('buildNanoArgs: includes -s size and -r ratio when given', () => {
  const a = buildNanoArgs({ scriptPath: GEN, prompt: 'x', out: '/o.png', size: '2K', ratio: '16:9' });
  assert.equal(a[a.indexOf('-s') + 1], '2K');
  assert.equal(a[a.indexOf('-r') + 1], '16:9');
});

test('buildNanoArgs: emits no -i when refs is empty', () => {
  assert.ok(!buildNanoArgs({ scriptPath: GEN, prompt: 'x', out: '/o.png' }).includes('-i'));
});

function fakeRunner(status, sink) {
  return (argv) => { if (sink) sink.argv = argv; return { status }; };
}

test('generateImage: throws when prompt is empty', () => {
  const g = makeNanoBanana({ scriptPath: GEN, runner: fakeRunner(0) });
  assert.throws(() => g.generateImage({ prompt: '', out: '/o.png' }));
});

test('generateImage: throws when out is empty', () => {
  const g = makeNanoBanana({ scriptPath: GEN, runner: fakeRunner(0) });
  assert.throws(() => g.generateImage({ prompt: 'x', out: '' }));
});

test('generateImage: calls the injected runner with the built argv', () => {
  const sink = {};
  const g = makeNanoBanana({ scriptPath: GEN, runner: fakeRunner(0, sink) });
  g.generateImage({ prompt: 'a cat', out: '/c.png', refs: ['/r.jpg'] });
  assert.equal(sink.argv[0], GEN);
  assert.equal(sink.argv[1], 'a cat');
  assert.equal(sink.argv[sink.argv.indexOf('-i') + 1], '/r.jpg');
});

test('generateImage: returns {ok:true,out} when the runner exits 0', () => {
  const g = makeNanoBanana({ scriptPath: GEN, runner: fakeRunner(0) });
  const r = g.generateImage({ prompt: 'x', out: '/o.png' });
  assert.equal(r.ok, true);
  assert.equal(r.out, '/o.png');
});

test('generateImage: returns {ok:false,code} when the runner exits nonzero', () => {
  const g = makeNanoBanana({ scriptPath: GEN, runner: fakeRunner(7) });
  const r = g.generateImage({ prompt: 'x', out: '/o.png' });
  assert.equal(r.ok, false);
  assert.equal(r.code, 7);
});
