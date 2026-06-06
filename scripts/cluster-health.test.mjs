// cluster-health.test.mjs — per-cluster health + decline detection over a dispatch/usage log.
// Run: node --test. Pure: the JSONL reader is injected, so no real files are ever touched here.

import { test } from 'node:test';
import assert from 'node:assert';
import { clusterHealth, loadEvents } from './cluster-health.mjs';

// Helper: build a run of N events for one cluster with a fixed ok value, timestamps increasing.
const run = (cluster, ok, n, t0 = 0) =>
  Array.from({ length: n }, (_, i) => ({ cluster, ok, ts: t0 + i }));

test('successRate and recentRate are computed correctly for a single cluster', () => {
  // 10 events: 8 ok, 2 fail → overall 0.8. With window=4 over the LAST four (all ok here) → 1.0.
  const events = [
    ...run('frontend-web', false, 2, 0),   // oldest two fail
    ...run('frontend-web', true, 8, 100),  // newest eight succeed
  ];
  const { clusters } = clusterHealth(events, { window: 4 });
  const c = clusters['frontend-web'];
  assert.equal(c.runs, 10);
  assert.equal(c.successRate, 0.8, 'overall success rate across all 10 events');
  assert.equal(c.recentRate, 1, 'last 4 events were all ok');
  assert.equal(c.declining, false, 'recent is ABOVE overall → not declining');
});

test('a cluster whose recent runs are mostly failures is flagged declining', () => {
  // 20 ok then 10 fail. window=10 → recentRate=0 vs overall=20/30≈0.667 → drop ≫ 0.2 → declining.
  const events = [
    ...run('media-gen', true, 20, 0),
    ...run('media-gen', false, 10, 1000),
  ];
  const out = clusterHealth(events, { window: 10, declineDrop: 0.2 });
  const c = out.clusters['media-gen'];
  assert.equal(c.runs, 30);
  assert.ok(Math.abs(c.successRate - 20 / 30) < 1e-9, 'overall ≈ 0.667');
  assert.equal(c.recentRate, 0, 'the last 10 were all failures');
  assert.equal(c.declining, true);
  assert.deepEqual(out.declining, ['media-gen'], 'the declining list surfaces the cluster');
});

test('a steady cluster (recent matches overall) is NOT declining', () => {
  const events = run('infra', true, 25, 0); // all ok
  const out = clusterHealth(events, { window: 10, declineDrop: 0.2 });
  assert.equal(out.clusters['infra'].declining, false);
  assert.deepEqual(out.declining, []);
});

test('declineDrop is a threshold: a dip SMALLER than the drop is not flagged', () => {
  // overall ~0.9, recent 0.8 → drop 0.1 < 0.2 → steady. (10-event window: 8 ok / 2 fail = 0.8.)
  const events = [
    ...run('borderline', true, 90, 0),
    // last 10: 8 ok, 2 fail
    ...run('borderline', true, 8, 1000),
    ...run('borderline', false, 2, 2000),
  ];
  const out = clusterHealth(events, { window: 10, declineDrop: 0.2 });
  const c = out.clusters['borderline'];
  assert.equal(c.recentRate, 0.8);
  assert.equal(c.declining, false, '0.1 dip is under the 0.2 decline threshold');
});

test('multiple clusters are tracked independently in one pass', () => {
  const events = [
    ...run('good', true, 12, 0),
    ...run('bad', true, 5, 0),
    ...run('bad', false, 7, 500), // recent failures dominate
  ];
  const out = clusterHealth(events, { window: 7, declineDrop: 0.2 });
  assert.equal(out.clusters['good'].declining, false);
  assert.equal(out.clusters['bad'].declining, true);
  assert.deepEqual(out.declining, ['bad']);
});

test('window larger than a cluster history just uses every event (recent == overall)', () => {
  const events = [...run('small', true, 3, 0), ...run('small', false, 1, 10)];
  const out = clusterHealth(events, { window: 50, declineDrop: 0.2 });
  const c = out.clusters['small'];
  assert.equal(c.successRate, 0.75);
  assert.equal(c.recentRate, 0.75, 'window exceeds history → recent equals overall');
  assert.equal(c.declining, false);
});

test('an empty event log yields empty clusters and no declines', () => {
  const out = clusterHealth([]);
  assert.deepEqual(out.clusters, {});
  assert.deepEqual(out.declining, []);
});

test('loadEvents parses a JSONL log and tolerates blank + garbage lines', () => {
  const file = [
    '{"cluster":"a","ok":true,"ts":1}',
    '',                                  // blank line → skipped
    '   ',                               // whitespace-only → skipped
    'not json at all',                   // garbage → skipped, not thrown
    '{"cluster":"a","ok":false,"ts":2}',
    '{bad json',                         // torn/partial line → skipped
    '{"cluster":"b","ok":true,"ts":3}',
  ].join('\n');

  const events = loadEvents('/whatever/log.jsonl', { readImpl: () => file });
  assert.equal(events.length, 3, 'only the 3 well-formed lines survive');
  assert.deepEqual(events.map((e) => e.cluster), ['a', 'a', 'b']);

  // …and it composes: feeding the parsed events to clusterHealth works end-to-end.
  const out = clusterHealth(events, { window: 10 });
  assert.equal(out.clusters['a'].runs, 2);
  assert.equal(out.clusters['a'].successRate, 0.5);
  assert.equal(out.clusters['b'].runs, 1);
});

test('loadEvents on an empty file returns an empty array', () => {
  const events = loadEvents('/whatever/empty.jsonl', { readImpl: () => '' });
  assert.deepEqual(events, []);
});
