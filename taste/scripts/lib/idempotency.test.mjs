// idempotency.test.mjs — the irreversible-action interlock for the venture loop.
// Run: node --test taste/scripts/lib/idempotency.test.mjs
//
// The loop retries failed steps. A retry of an irreversible action (cold email, deploy)
// must NOT fire twice. actionKey() makes a deterministic key; once() fires-or-skips.

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  actionKey,
  once,
  makeMemoryStore,
  makeJsonlStore,
} from './idempotency.mjs';

// --- actionKey -------------------------------------------------------------------------------------

test('actionKey returns a 64-char lowercase sha256 hex string', () => {
  const k = actionKey('outreach', { to: 'a@b.com' });
  assert.match(k, /^[0-9a-f]{64}$/);
});

test('actionKey is deterministic for identical (type, payload)', () => {
  const a = actionKey('outreach', { to: 'a@b.com' });
  const b = actionKey('outreach', { to: 'a@b.com' });
  assert.equal(a, b);
});

test('actionKey differs for different payloads (same type)', () => {
  const a = actionKey('outreach', { to: 'a@b.com' });
  const b = actionKey('outreach', { to: 'c@d.com' });
  assert.notEqual(a, b);
});

test('actionKey differs for different types (same payload)', () => {
  const a = actionKey('outreach', { to: 'a@b.com' });
  const b = actionKey('deploy', { to: 'a@b.com' });
  assert.notEqual(a, b);
});

test('actionKey is key-order independent at the top level', () => {
  assert.equal(
    actionKey('x', { a: 1, b: 2 }),
    actionKey('x', { b: 2, a: 1 }),
  );
});

test('actionKey is key-order independent when nested', () => {
  // sorting only the top level would leak nested order into the hash — guard against that
  assert.equal(
    actionKey('email', { to: 'a@b.com', headers: { x: 1, y: 2 } }),
    actionKey('email', { headers: { y: 2, x: 1 }, to: 'a@b.com' }),
  );
});

// --- once: fire-once semantics ---------------------------------------------------------------------

test('once calls fn exactly once and returns its result; a second call with the same key returns the FIRST result without calling fn2', async () => {
  const store = makeMemoryStore();
  let calls1 = 0;
  let calls2 = 0;

  const r1 = await once('k', () => { calls1++; return 'first'; }, { store });
  assert.equal(r1, 'first');
  assert.equal(calls1, 1);

  const r2 = await once('k', () => { calls2++; return 'second'; }, { store });
  assert.equal(r2, 'first', 'cached first result is returned');
  assert.equal(calls2, 0, 'fn2 is never called for an already-recorded key');
});

test('distinct keys each invoke their own fn (both run)', async () => {
  const store = makeMemoryStore();
  let calls = 0;
  const a = await once('a', () => { calls++; return 'A'; }, { store });
  const b = await once('b', () => { calls++; return 'B'; }, { store });
  assert.equal(a, 'A');
  assert.equal(b, 'B');
  assert.equal(calls, 2);
});

test('a recorded action whose result is undefined still short-circuits (gate is has(), not get())', async () => {
  const store = makeMemoryStore();
  let calls2 = 0;
  await once('k', () => undefined, { store }); // records key with an undefined result
  const r = await once('k', () => { calls2++; return 'ran-again'; }, { store });
  assert.equal(r, undefined, 'cached undefined result returned, not re-run');
  assert.equal(calls2, 0);
});

// --- once: failures must stay retryable ------------------------------------------------------------

test('when fn throws, the error propagates and the key is NOT recorded (a later once with the same key runs)', async () => {
  const store = makeMemoryStore();
  let okCalls = 0;

  await assert.rejects(
    () => once('k', () => { throw new Error('boom'); }, { store }),
    /boom/,
  );
  assert.equal(store.has('k'), false, 'failed action is not recorded');

  const r = await once('k', () => { okCalls++; return 'recovered'; }, { store });
  assert.equal(r, 'recovered');
  assert.equal(okCalls, 1, 'retry of a previously-failed key actually runs');
});

test('an async fn that rejects also leaves the key unrecorded', async () => {
  const store = makeMemoryStore();
  await assert.rejects(
    () => once('k', async () => { throw new Error('async-boom'); }, { store }),
    /async-boom/,
  );
  assert.equal(store.has('k'), false);
});

// --- store interface + durability ------------------------------------------------------------------

test('makeMemoryStore exposes the {has, get, put} interface', () => {
  const store = makeMemoryStore();
  assert.equal(typeof store.has, 'function');
  assert.equal(typeof store.get, 'function');
  assert.equal(typeof store.put, 'function');
  assert.equal(store.has('nope'), false);
  store.put('k', { sent: true });
  assert.equal(store.has('k'), true);
  assert.deepEqual(store.get('k'), { sent: true });
});

test('JSONL store persists across instances on the same file (proves cross-process durability)', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'idem-')), 'ledger.jsonl');

  // process A: record an action
  const a = makeJsonlStore(file);
  a.put('action-1', { sent: true });
  assert.equal(a.has('action-1'), true);

  // process B: a FRESH store pointed at the same file must see the prior record
  const b = makeJsonlStore(file);
  assert.equal(b.has('action-1'), true, 'fresh store reconstructs state from the file');
  assert.deepEqual(b.get('action-1'), { sent: true });

  // and it should be real JSONL on disk: one record line carrying the key
  const raw = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
  assert.equal(raw.length, 1);
  const rec = JSON.parse(raw[0]);
  assert.equal(rec.key, 'action-1');
  assert.deepEqual(rec.result, { sent: true });
  assert.equal(typeof rec.ts, 'string', 'each record carries a timestamp');
});

test('once persists through a JSONL store so a fresh store skips fn (durable interlock end-to-end)', async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'idem-')), 'ledger.jsonl');
  const key = actionKey('outreach', { to: 'lead@example.com' });

  let sends = 0;
  await once(key, () => { sends++; return { messageId: 'm1' }; }, { store: makeJsonlStore(file) });
  assert.equal(sends, 1);

  // simulate a retry in a new process: brand-new store from the same file
  const r = await once(key, () => { sends++; return { messageId: 'm2' }; }, { store: makeJsonlStore(file) });
  assert.deepEqual(r, { messageId: 'm1' }, 'cached first result returned, second send suppressed');
  assert.equal(sends, 1, 'the irreversible action did not fire twice');
});
