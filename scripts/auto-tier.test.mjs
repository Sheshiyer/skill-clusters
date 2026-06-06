// auto-tier.test.mjs — suggest active<->deferred tier changes from dispatch usage. Run: node --test
// Pure: `now` is injected so "recent" and "idle" are deterministic. suggestTiers SUGGESTS only;
// applying the change is tier.mjs's job, so this never touches the filesystem.
//
// NOTE: suggestTiers is driven off the index, so EVERY active cluster with no recent usage is a defer
// candidate. Each test therefore uses a scenario-local index containing only the clusters under test,
// so assertions stay exact (no "other active cluster also defaulted to defer" cross-talk).

import { test } from 'node:test';
import assert from 'node:assert';
import { suggestTiers } from './auto-tier.mjs';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_000 * DAY; // a fixed "today" in ms

test('a deferred cluster used recently → activate', () => {
  const index = { freshDeferred: { tier: 'deferred' } };
  const usage = [{ cluster: 'freshDeferred', ts: NOW - 0.5 * DAY }];
  const { activate, defer } = suggestTiers(usage, { index, now: NOW });
  assert.deepEqual(activate, ['freshDeferred']);
  assert.deepEqual(defer, []);
});

test('an active cluster idle past idleDefer → defer', () => {
  // idleActive last seen 40 days ago, default idleDefer = 30 → defer
  const index = { idleActive: { tier: 'active' } };
  const usage = [{ cluster: 'idleActive', ts: NOW - 40 * DAY }];
  const { activate, defer } = suggestTiers(usage, { index, now: NOW });
  assert.deepEqual(activate, []);
  assert.deepEqual(defer, ['idleActive']);
});

test('an active cluster used within idleDefer is NOT deferred', () => {
  const index = { active: { tier: 'active' } };
  const usage = [{ cluster: 'active', ts: NOW - 5 * DAY }];
  const { defer } = suggestTiers(usage, { index, now: NOW });
  assert.deepEqual(defer, [], 'recent activity keeps it active');
});

test('a deferred cluster with NO recent usage is NOT activated', () => {
  // recentActivate default = 1 day; usage is 10 days old → not "recent" → no activate
  const index = { deferred: { tier: 'deferred' } };
  const usage = [{ cluster: 'deferred', ts: NOW - 10 * DAY }];
  const { activate } = suggestTiers(usage, { index, now: NOW });
  assert.deepEqual(activate, [], 'stale usage does not re-activate a deferred cluster');
});

test('active clusters with NO usage events at all → idle since forever → all defer', () => {
  // With zero dispatches, EVERY active cluster is idle past any window → defer. Deferred clusters with
  // no recent usage are never activated.
  const index = {
    active: { tier: 'active' },
    idleActive: { tier: 'active' },
    deferred: { tier: 'deferred' },
  };
  const { activate, defer } = suggestTiers([], { index, now: NOW });
  assert.deepEqual(defer.sort(), ['active', 'idleActive'].sort(),
    'every active cluster with zero dispatches is a defer candidate');
  assert.deepEqual(activate, [], 'no deferred cluster has recent usage → nothing to activate');
});

test('recency uses the MOST RECENT dispatch per cluster', () => {
  // freshDeferred has an old AND a recent event — the recent one wins → activate.
  const index = { freshDeferred: { tier: 'deferred' } };
  const usage = [
    { cluster: 'freshDeferred', ts: NOW - 90 * DAY },
    { cluster: 'freshDeferred', ts: NOW - 0.5 * DAY },
  ];
  const { activate } = suggestTiers(usage, { index, now: NOW });
  assert.deepEqual(activate, ['freshDeferred']);
});

test('boundary: exactly idleDefer days idle defers (idle >= idleDefer triggers)', () => {
  // last seen exactly 30 days ago. Spec: defer when idle >= idleDefer.
  const index = { idleActive: { tier: 'active' } };
  const usage = [{ cluster: 'idleActive', ts: NOW - 30 * DAY }];
  const { defer } = suggestTiers(usage, { index, now: NOW, idleDefer: 30 });
  assert.deepEqual(defer, ['idleActive'], 'idle of exactly idleDefer days defers (>=)');
});

test('boundary: exactly recentActivate days old still counts as recent (<=) → activate', () => {
  const index = { freshDeferred: { tier: 'deferred' } };
  const usage = [{ cluster: 'freshDeferred', ts: NOW - 1 * DAY }];
  const { activate } = suggestTiers(usage, { index, now: NOW, recentActivate: 1 });
  assert.deepEqual(activate, ['freshDeferred'], 'usage exactly recentActivate days old is recent');
});

test('custom windows are honored', () => {
  const index = {
    freshDeferred: { tier: 'deferred' },
    idleActive: { tier: 'active' },
  };
  const usage = [
    { cluster: 'freshDeferred', ts: NOW - 6 * DAY }, // recent under a 7-day activate window
    { cluster: 'idleActive', ts: NOW - 8 * DAY },    // idle past a 7-day defer window
  ];
  const { activate, defer } = suggestTiers(usage, { index, now: NOW, idleDefer: 7, recentActivate: 7 });
  assert.deepEqual(activate, ['freshDeferred']);
  assert.deepEqual(defer, ['idleActive']);
});

test('usage for an unknown cluster (not in index) is ignored', () => {
  const index = { active: { tier: 'active' } };
  const usage = [
    { cluster: 'ghost', ts: NOW },             // not in index → ignored entirely
    { cluster: 'active', ts: NOW - 1 * DAY },  // keeps `active` fresh so it doesn't defer
  ];
  const { activate, defer } = suggestTiers(usage, { index, now: NOW });
  assert.ok(!activate.includes('ghost'));
  assert.ok(!defer.includes('ghost'));
  assert.deepEqual(defer, [], 'known active cluster stayed fresh; ghost ignored');
});

test('is pure — does not mutate usage or index', () => {
  const index = { freshDeferred: { tier: 'deferred' } };
  const usage = [{ cluster: 'freshDeferred', ts: NOW - 1 * DAY }];
  const snapUsage = JSON.parse(JSON.stringify(usage));
  const snapIndex = JSON.parse(JSON.stringify(index));
  suggestTiers(usage, { index, now: NOW });
  assert.deepEqual(usage, snapUsage, 'usage untouched');
  assert.deepEqual(index, snapIndex, 'index untouched');
});
