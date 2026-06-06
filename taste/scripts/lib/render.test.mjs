// render.test.mjs — VTO try-on render engine: idempotency + governance + graceful fallback.
// All cases inject a MOCK image adapter — NO live spend. Run: node --test render.test.mjs
//
// The engine reuses the Phase-0 safety libs: actionKey/once (idempotency), router.generate (dispatch
// to the `image` lane), and the budget governor (via generate's cap). These tests prove the wiring
// through REAL generate() + governor, mocking only the leaf image adapter (the thing that would spend).

import { test } from 'node:test';
import assert from 'node:assert';
import { renderTryOn } from './render.mjs';
import { makeMemoryStore } from './idempotency.mjs';

const REQ = { productImage: 'https://shop/img/dress.jpg', body: 'preset:athletic', venture: 'fitcheck' };
// the router `image` lane's provider is `gpt-image-2`; inject a mock so nothing real is generated.
const okAdapter = (counter) => ({ 'gpt-image-2': { run: async () => { counter.n++; return { url: 'mock://render.png' }; } } });

test('renderTryOn: identical request generates exactly once (idempotency ledger)', async () => {
  const counter = { n: 0 };
  const store = makeMemoryStore();
  const a = await renderTryOn(REQ, { adapters: okAdapter(counter), store, cap: 100 });
  const b = await renderTryOn(REQ, { adapters: okAdapter(counter), store, cap: 100 });
  assert.equal(counter.n, 1, 'the image model fired once for two identical requests');
  assert.deepEqual(a, b, 'second call returns the cached render');
  assert.equal(a.status, 'rendered');
});

test('renderTryOn: distinct requests both generate', async () => {
  const counter = { n: 0 };
  const store = makeMemoryStore();
  await renderTryOn(REQ, { adapters: okAdapter(counter), store, cap: 100 });
  await renderTryOn({ ...REQ, body: 'preset:petite' }, { adapters: okAdapter(counter), store, cap: 100 });
  assert.equal(counter.n, 2, 'a different body is a different render');
});

test('renderTryOn: over-budget venture → BudgetPaused, model never fires (no silent spend)', async () => {
  const counter = { n: 0 };
  await assert.rejects(
    () => renderTryOn(REQ, { adapters: okAdapter(counter), store: makeMemoryStore(), cap: 0 }),
    /BudgetPaused|paused/i,
  );
  assert.equal(counter.n, 0, 'budget stopped the call before any generation');
});

test('renderTryOn: adapter failure → graceful fallback object (not a crash)', async () => {
  const failAdapter = { 'gpt-image-2': { run: async () => { throw new Error('image model down'); } } };
  const out = await renderTryOn(REQ, { adapters: failAdapter, store: makeMemoryStore(), cap: 100 });
  assert.equal(out.status, 'fallback');
  assert.equal(out.image, null);
  assert.ok(out.fallback, 'a fallback path is offered (preset / email the render)');
});

test('renderTryOn: missing productImage or body → throws (bad input is not a fallback)', async () => {
  await assert.rejects(() => renderTryOn({ body: 'preset:athletic' }, { store: makeMemoryStore() }), /required/i);
  await assert.rejects(() => renderTryOn({ productImage: 'x' }, { store: makeMemoryStore() }), /required/i);
});
