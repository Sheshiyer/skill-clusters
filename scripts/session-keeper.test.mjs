// session-keeper.test.mjs — health-tracker for session-based image/video providers. Run: node --test
// Pure unit logic: the live probe and the clock are both injected, so no network and no wall-clock —
// every state transition (ok → degraded → expired) is driven deterministically.

import { test } from 'node:test';
import assert from 'node:assert';
import { checkSessions, needsRefresh, GRACE_MS } from './session-keeper.mjs';

const NOW = 1_000_000; // a fixed "current time" in ms; the injected clock returns exactly this.

test('a live probe marks the session ok and stamps a fresh lastOkTs', async () => {
  const report = await checkSessions(
    [{ name: 'gpt-image-2', lastOkTs: NOW - 5_000 }],
    { probe: async () => true, now: () => NOW },
  );
  assert.equal(report.length, 1);
  assert.equal(report[0].status, 'ok');
  assert.equal(report[0].lastOkTs, NOW, 'a successful probe advances lastOkTs to now');
  assert.equal(report[0].checkedAt, NOW);
});

test('a failing probe within the grace window is degraded, not expired', async () => {
  // last success was 1s before the grace boundary → still inside grace → degraded.
  const report = await checkSessions(
    [{ name: 'arcplume', lastOkTs: NOW - (GRACE_MS - 1_000) }],
    { probe: async () => { throw new Error('session token rejected'); }, now: () => NOW },
  );
  assert.equal(report[0].status, 'degraded', 'recent prior success keeps a failing probe degraded');
  assert.equal(report[0].lastOkTs, NOW - (GRACE_MS - 1_000), 'a failed probe must NOT move lastOkTs');
});

test('a failing probe with a stale lastOkTs is expired', async () => {
  // last success is older than the grace window → past saving → expired.
  const report = await checkSessions(
    [{ name: 'arcplume', lastOkTs: NOW - (GRACE_MS + 1) }],
    { probe: async () => false, now: () => NOW }, // a falsy (non-throwing) probe is also a failure
  );
  assert.equal(report[0].status, 'expired');
});

test('a provider that has never succeeded (no lastOkTs) and fails its probe is expired', async () => {
  const report = await checkSessions(
    [{ name: 'gpt-image-2' }], // no lastOkTs at all
    { probe: async () => false, now: () => NOW },
  );
  assert.equal(report[0].status, 'expired', 'no prior success → nothing to grace → expired on failure');
});

test('checkSessions handles a mixed fleet and never lets one bad probe break the others', async () => {
  const report = await checkSessions(
    [
      { name: 'live', lastOkTs: NOW - 1_000 },
      { name: 'grace', lastOkTs: NOW - 1_000 },           // failing but recent → degraded
      { name: 'dead', lastOkTs: NOW - (GRACE_MS + 5_000) }, // failing + stale → expired
    ],
    {
      probe: async (name) => {
        if (name === 'live') return true;
        throw new Error(`${name} down`);
      },
      now: () => NOW,
    },
  );
  const byName = Object.fromEntries(report.map((r) => [r.name, r.status]));
  assert.deepEqual(byName, { live: 'ok', grace: 'degraded', dead: 'expired' });
});

test('needsRefresh returns ONLY the expired provider names — the refresh/alert list', async () => {
  const report = await checkSessions(
    [
      { name: 'live', lastOkTs: NOW - 1_000 },
      { name: 'grace', lastOkTs: NOW - 1_000 },
      { name: 'dead-a', lastOkTs: NOW - (GRACE_MS + 1) },
      { name: 'dead-b' },
    ],
    {
      probe: async (name) => name === 'live',
      now: () => NOW,
    },
  );
  assert.deepEqual(needsRefresh(report).sort(), ['dead-a', 'dead-b'], 'degraded is NOT a refresh trigger; only expired');
});

test('an ok probe rescues a provider whose lastOkTs was already stale (recovery path)', async () => {
  // Even if the provider was on the brink, a fresh successful probe returns it to ok and re-stamps it.
  const report = await checkSessions(
    [{ name: 'recovered', lastOkTs: NOW - (GRACE_MS + 10_000) }],
    { probe: async () => true, now: () => NOW },
  );
  assert.equal(report[0].status, 'ok');
  assert.equal(report[0].lastOkTs, NOW);
});
