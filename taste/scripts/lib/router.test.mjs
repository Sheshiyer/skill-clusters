// router.test.mjs — best-of-breed model router (task → provider chain, failover, budget).
// Run: node --test taste/scripts/lib/router.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';
import { route, generate, ROUTES } from './router.mjs';

test('route(creative-text): ollama primary, nim fallback', () => {
  const attempts = route('creative-text');
  assert.equal(attempts[0].provider, 'ollama');
  assert.equal(attempts[1].provider, 'nim');
});

test('route(embed): nim with nv-embedqa-e5-v5', () => {
  const attempts = route('embed');
  assert.equal(attempts[0].provider, 'nim');
  assert.match(attempts[0].model, /nv-embedqa-e5-v5/);
});

test('route(structured-json): nim primary, ollama fallback', () => {
  const attempts = route('structured-json');
  assert.equal(attempts[0].provider, 'nim');
  assert.equal(attempts[1].provider, 'ollama');
});

test('route(zzz): unknown task throws', () => {
  assert.throws(() => route('zzz'), /unknown task/i);
});

test('route returns a copy — mutating it does not corrupt the ROUTES table', () => {
  const a = route('embed');
  a.push({ provider: 'evil', model: 'x' });
  assert.equal(route('embed').length, ROUTES['embed'].length, 'ROUTES must be immutable to callers');
});

test('generate: primary throws → falls over to next adapter and returns its result', async () => {
  const calls = [];
  const adapters = {
    ollama: { run: async () => { calls.push('ollama'); throw new Error('local daemon down (simulated)'); } },
    nim: { run: async (model, payload) => { calls.push('nim'); return `nim-ok:${payload.prompt}`; } },
  };
  const out = await generate('creative-text', { prompt: 'hi' }, { adapters });
  assert.equal(out, 'nim-ok:hi');
  assert.deepEqual(calls, ['ollama', 'nim'], 'tried ollama first, then nim');
});

test('generate: all attempts throw → throws the LAST error', async () => {
  const adapters = {
    ollama: { run: async () => { throw new Error('first-fail'); } },
    nim: { run: async () => { throw new Error('last-fail'); } },
  };
  await assert.rejects(
    () => generate('creative-text', { prompt: 'x' }, { adapters }),
    /last-fail/,
  );
});

test('generate: a missing adapter for a provider is treated as a failover, not a crash', async () => {
  // creative-text = [ollama, nim]; omit ollama entirely → should skip to nim
  const adapters = {
    nim: { run: async () => 'nim-saved-the-day' },
  };
  const out = await generate('creative-text', { prompt: 'x' }, { adapters });
  assert.equal(out, 'nim-saved-the-day');
});

test('generate: charges the governor before calling (budget cap pauses the venture)', async () => {
  const adapters = { nim: { run: async () => 'ok' } };
  // embed has a known per-call cost; set a venture cap below it so the FIRST call is paused.
  await assert.rejects(
    () => generate('embed', { input: 'x' }, { adapters, venture: 'broke', cap: 0 }),
    /BudgetPaused|paused/i,
  );
});

test('generate(unknown task) throws before any adapter is touched', async () => {
  let touched = false;
  const adapters = { nim: { run: async () => { touched = true; return 'x'; } } };
  await assert.rejects(() => generate('zzz', {}, { adapters }), /unknown task/i);
  assert.equal(touched, false);
});
