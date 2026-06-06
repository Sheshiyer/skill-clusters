// governor.test.mjs — budget + rate governor for per-venture spend.
// Run: node --test taste/scripts/lib/governor.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';
import { makeGovernor, BudgetPaused, RateLimited } from './governor.mjs';

test('charge accumulates per-venture spend independently', () => {
  const g = makeGovernor({ cap: Infinity });
  g.charge('alpha', 10);
  g.charge('alpha', 5);
  g.charge('beta', 3);
  assert.equal(g.spent('alpha'), 15);
  assert.equal(g.spent('beta'), 3);
  assert.equal(g.spent('unknown'), 0); // never-charged venture reads as 0, not NaN/undefined
});

test('cap=100: 70 ok, +15 warns at >=80%, +20 throws BudgetPaused at >=100%', () => {
  const warns = [];
  const g = makeGovernor({ cap: 100, onWarn: (w) => warns.push(w) });

  // 70 — well under the 80% line, no warn
  g.charge('v', 70);
  assert.equal(warns.length, 0, 'no warn below 80%');

  // +15 → 85, crosses the 80% threshold → exactly one warn
  g.charge('v', 15);
  assert.equal(warns.length, 1, 'warn fires when crossing >=80%');
  assert.equal(g.spent('v'), 85);

  // +20 → 105, hits the cap → BudgetPaused (and spend NOT applied)
  assert.throws(() => g.charge('v', 20), BudgetPaused);
  assert.equal(g.spent('v'), 85, 'rejected charge does not mutate spend');
});

test('warn only fires once per venture (no warn spam on every subsequent charge)', () => {
  const warns = [];
  const g = makeGovernor({ cap: 100, onWarn: (w) => warns.push(w) });
  g.charge('v', 80); // crosses 80% → 1 warn
  g.charge('v', 5);  // still in [80,100) → no new warn
  assert.equal(warns.length, 1);
});

test('ratePerMin=2: 3rd call within the window throws RateLimited', () => {
  let now = 0;
  const clock = () => now; // injected clock, ms
  const g = makeGovernor({ ratePerMin: 2, clock });
  g.charge('v', 1); // 1
  g.charge('v', 1); // 2
  assert.throws(() => g.charge('v', 1), RateLimited); // 3rd in the same minute → throttled
});

test('rate bucket refills after the window elapses', () => {
  let now = 0;
  const clock = () => now;
  const g = makeGovernor({ ratePerMin: 2, clock });
  g.charge('v', 1);
  g.charge('v', 1);
  assert.throws(() => g.charge('v', 1), RateLimited);
  now += 60_000; // a full minute passes → bucket refilled
  assert.doesNotThrow(() => g.charge('v', 1));
});

test('rate limit is enforced per-venture, not globally', () => {
  let now = 0;
  const g = makeGovernor({ ratePerMin: 1, clock: () => now });
  g.charge('alpha', 1);
  g.charge('beta', 1); // different venture → its own bucket, not throttled
  assert.throws(() => g.charge('alpha', 1), RateLimited);
});
