// variable-contract.test.mjs — the canonical variable-contract groups taste produces.
// Run: node --test taste/scripts/lib/variable-contract.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { variableContract } from './variable-contract.mjs';

test('variableContract returns all 5 canonical produced groups', () => {
  const vc = variableContract({ classification: { category: 'Modern Minimalism', motion: 'smooth', type: 'clean' }, cluster: 'creative-frontend', directive: 'Make it feel modern.' });
  for (const g of ['taste_brief', 'asset_plan', 'section_plan', 'interaction_plan', 'acceptance_checks']) {
    assert.ok(g in vc, `missing ${g}`);
  }
});

test('variableContract groups are structured + non-empty', () => {
  const vc = variableContract({ classification: {}, cluster: 'x', directive: 'd' });
  assert.ok(vc.taste_brief.length > 0);
  assert.ok(Array.isArray(vc.section_plan) && vc.section_plan.length > 0);
  assert.ok(Array.isArray(vc.acceptance_checks) && vc.acceptance_checks.length > 0);
  assert.equal(typeof vc.asset_plan, 'object');
  assert.equal(typeof vc.interaction_plan, 'object');
});

test('variableContract carries the classification into interaction_plan', () => {
  const vc = variableContract({ classification: { motion: 'kinetic', type: 'editorial' }, cluster: 'c', directive: 'd' });
  assert.equal(vc.interaction_plan.motion, 'kinetic');
  assert.equal(vc.interaction_plan.type, 'editorial');
});

test('variableContract is pure — no args still yields the 5 groups', () => {
  const vc = variableContract();
  assert.equal(Object.keys(vc).filter((k) => ['taste_brief', 'asset_plan', 'section_plan', 'interaction_plan', 'acceptance_checks'].includes(k)).length, 5);
});
