// budget-report.test.mjs — per-venture budget dashboard over governor spend. Run: node --test
// Pure: budgetReport is a deterministic projection of {spend} + {caps}, no clock, no I/O.

import { test } from 'node:test';
import assert from 'node:assert';
import { budgetReport } from './budget-report.mjs';

test('classifies ok / warn / over / uncapped and counts them', () => {
  const r = budgetReport(
    { alpha: 40, beta: 85, gamma: 120, delta: 9 },
    { caps: { alpha: 100, beta: 100, gamma: 100 } }, // delta has no cap → uncapped
  );
  const byV = Object.fromEntries(r.ventures.map((v) => [v.venture, v]));

  assert.equal(byV.alpha.status, 'ok', '40/100 = 0.4 < warnAt → ok');
  assert.equal(byV.beta.status, 'warn', '85/100 = 0.85 in [0.8,1) → warn');
  assert.equal(byV.gamma.status, 'over', '120/100 = 1.2 >= 1 → over');
  assert.equal(byV.delta.status, 'uncapped', 'no cap declared → uncapped');

  assert.equal(byV.alpha.pct, 0.4);
  assert.equal(byV.beta.spent, 85);
  assert.equal(byV.beta.cap, 100);

  assert.equal(r.overCount, 1, 'only gamma is over');
  assert.equal(r.warnCount, 1, 'only beta is warn (over is counted separately, not as warn)');
});

test('the warn band is inclusive at warnAt and exclusive at 1.0', () => {
  const r = budgetReport(
    { lo: 80, hi: 99 },
    { caps: { lo: 100, hi: 100 }, warnAt: 0.8 },
  );
  const byV = Object.fromEntries(r.ventures.map((v) => [v.venture, v]));
  assert.equal(byV.lo.status, 'warn', 'exactly 0.8 → warn (>= warnAt)');
  assert.equal(byV.hi.status, 'warn', '0.99 still < 1.0 → warn');
});

test('exactly at the cap (pct === 1) is over, not warn', () => {
  const r = budgetReport({ v: 100 }, { caps: { v: 100 } });
  assert.equal(r.ventures[0].status, 'over');
  assert.equal(r.ventures[0].pct, 1);
  assert.equal(r.overCount, 1);
  assert.equal(r.warnCount, 0);
});

test('custom warnAt threshold is honored', () => {
  const r = budgetReport({ v: 55 }, { caps: { v: 100 }, warnAt: 0.5 });
  assert.equal(r.ventures[0].status, 'warn', '0.55 >= warnAt 0.5 → warn');
});

test('uncapped ventures carry a null cap and null pct, and are excluded from counts', () => {
  const r = budgetReport({ a: 1000, b: 5 }, { caps: {} });
  for (const v of r.ventures) {
    assert.equal(v.status, 'uncapped');
    assert.equal(v.cap, null);
    assert.equal(v.pct, null);
  }
  assert.equal(r.overCount, 0);
  assert.equal(r.warnCount, 0);
});

test('a zero cap is degenerate: any spend is over, zero spend is over (pct treated as >=1)', () => {
  // cap 0 is a hard "no budget" — anything (including 0) is at/over it. Guard against divide-by-zero.
  const r = budgetReport({ a: 5, b: 0 }, { caps: { a: 0, b: 0 } });
  const byV = Object.fromEntries(r.ventures.map((v) => [v.venture, v]));
  assert.equal(byV.a.status, 'over');
  assert.equal(byV.b.status, 'over');
  assert.equal(r.overCount, 2);
});

test('defaults: no opts at all → every venture is uncapped, warnAt defaults to 0.8', () => {
  const r = budgetReport({ a: 10 });
  assert.equal(r.ventures[0].status, 'uncapped');
  assert.equal(r.overCount, 0);
  assert.equal(r.warnCount, 0);
});

test('empty spend → empty ventures, zero counts', () => {
  const r = budgetReport({}, { caps: { a: 100 } });
  assert.deepEqual(r.ventures, []);
  assert.equal(r.overCount, 0);
  assert.equal(r.warnCount, 0);
});

test('is pure — same input twice yields deep-equal output and does not mutate inputs', () => {
  const spend = { a: 90 };
  const caps = { a: 100 };
  const r1 = budgetReport(spend, { caps });
  const r2 = budgetReport(spend, { caps });
  assert.deepEqual(r1, r2);
  assert.deepEqual(spend, { a: 90 }, 'spend not mutated');
  assert.deepEqual(caps, { a: 100 }, 'caps not mutated');
});

test('pct is the raw ratio (can exceed 1 for over) and is rounded deterministically', () => {
  const r = budgetReport({ a: 150 }, { caps: { a: 100 } });
  assert.equal(r.ventures[0].pct, 1.5);
});
