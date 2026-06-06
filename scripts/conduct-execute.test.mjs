// conduct-execute.test.mjs — the generalized conductor execute loop. Run: node --test
// The loop is venture-agnostic: resolve tasks → inject the on-brand taste brief → dispatch the
// resolved cluster orchestrator → record. Every dependency is injected, so this is pure unit logic.

import { test } from 'node:test';
import assert from 'node:assert';
import { executePlan } from './conduct-execute.mjs';

const twoTasks = async () => ({ plan: [
  { id: 'T1', desc: 'build the hero', cluster: 'frontend-web', dispatch: 'frontend-web-orchestrator' },
  { id: 'T2', desc: 'render the garment', cluster: 'media-gen', dispatch: 'media-gen-orchestrator', activate: true },
] });

test('executePlan: each resolved task gets an on-brand brief + is dispatched to its cluster', async () => {
  const seen = [];
  const out = await executePlan({ tasksPath: 'x', planPath: 'y', brand: 'acme' }, {
    resolveTask: twoTasks,
    tasteResolve: async (req, brand) => ({ directive: `on-brand ${brand}: ${req}` }),
    dispatch: async (task, cluster, brief) => { seen.push({ id: task.id, cluster, brief: brief.directive }); return { ok: true, result: `built:${task.id}` }; },
  });
  assert.equal(out.brand, 'acme');
  assert.equal(out.tasks, 2);
  assert.equal(seen.length, 2, 'both resolved tasks dispatched');
  assert.match(seen[0].brief, /on-brand acme: build the hero/, 'taste brief injected per task');
  assert.deepEqual(out.touched.sort(), ['frontend-web', 'media-gen']);
  assert.equal(out.results[0].status, 'built');
});

test('executePlan: deferred clusters needing activation are surfaced', async () => {
  const out = await executePlan({ tasksPath: 'x', brand: 'acme' }, {
    resolveTask: twoTasks,
    tasteResolve: async () => ({ directive: 'x' }),
    dispatch: async () => ({ ok: true }),
  });
  assert.deepEqual(out.activate, ['media-gen'], 'media-gen flagged for activation before dispatch');
});

test('executePlan: an unresolved task is flagged and NOT dispatched', async () => {
  const seen = [];
  const out = await executePlan({ tasksPath: 'x', brand: 'acme' }, {
    resolveTask: async () => ({ plan: [{ id: 'T1', desc: '???', cluster: null }] }),
    tasteResolve: async () => ({ directive: 'x' }),
    dispatch: async (t) => { seen.push(t.id); return { ok: true }; },
  });
  assert.equal(seen.length, 0, 'unresolved task is not dispatched');
  assert.equal(out.results[0].status, 'unresolved');
});

test('executePlan: a failed dispatch is recorded and the loop continues', async () => {
  const out = await executePlan({ tasksPath: 'x', brand: 'acme' }, {
    resolveTask: async () => ({ plan: [
      { id: 'T1', desc: 'a', cluster: 'c1' }, { id: 'T2', desc: 'b', cluster: 'c2' },
    ] }),
    tasteResolve: async () => ({ directive: 'x' }),
    dispatch: async (t) => (t.id === 'T1' ? { ok: false, error: 'boom' } : { ok: true }),
  });
  assert.equal(out.results.find((r) => r.id === 'T1').status, 'failed');
  assert.equal(out.results.find((r) => r.id === 'T2').status, 'built', 'loop continued past the failure');
});

test('executePlan: taste-resolve failure does not abort the venture — task degrades to no-brief dispatch', async () => {
  const seen = [];
  const out = await executePlan({ tasksPath: 'x', brand: 'acme' }, {
    resolveTask: async () => ({ plan: [{ id: 'T1', desc: 'a', cluster: 'c1' }] }),
    tasteResolve: async () => { throw new Error('taste down'); },
    dispatch: async (t, c, brief) => { seen.push(brief); return { ok: true }; },
  });
  assert.equal(out.results[0].status, 'built');
  assert.equal(seen[0], null, 'dispatched with a null brief rather than crashing');
});
