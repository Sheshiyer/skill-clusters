// upsert.test.mjs — the additive `upsert` option on noesis.add / design-memory.add, and the
// idempotent re-registration it gives registerKit. Default behavior (append) is unchanged; upsert
// replaces any existing same-id row so a stable-id writer (registerKit's brand:version) never dups.

import test from 'node:test';
import assert from 'node:assert/strict';

import { makeNoesis } from './noesis.mjs';
import { makeDesignMemory } from './design-memory.mjs';
import { registerKit } from '../kit-register.mjs';

test('noesis.add upsert: re-adding the same id replaces the row (no duplicate)', () => {
  const n = makeNoesis();
  n.add('brand', 'k', [1, 0, 0], { v: 1 }, { upsert: true });
  n.add('brand', 'k', [1, 0, 0], { v: 2 }, { upsert: true });
  assert.equal(n.stats().brand, 1, 'one row after two upserts of the same id');
  assert.equal(n.query('brand', [1, 0, 0], 5)[0].meta.v, 2, 'the latest write wins');
});

test('noesis.add default (no upsert) still appends — unchanged', () => {
  const n = makeNoesis();
  n.add('brand', 'k', [1, 0, 0], { v: 1 });
  n.add('brand', 'k', [1, 0, 0], { v: 2 });
  assert.equal(n.stats().brand, 2, 'default appends both rows');
});

test('design-memory.add upsert: re-adding the same id replaces the row', () => {
  const m = makeDesignMemory();
  m.add('acme', 'k', [1, 0, 0], { v: 1 }, { upsert: true });
  m.add('acme', 'k', [1, 0, 0], { v: 2 }, { upsert: true });
  assert.equal(m.all('acme').length, 1, 'one row');
  assert.equal(m.query('acme', [1, 0, 0], 1)[0].meta.v, 2, 'latest wins');
});

test('design-memory.add default still appends — unchanged', () => {
  const m = makeDesignMemory();
  m.add('acme', 'k', [1, 0, 0], { v: 1 });
  m.add('acme', 'k', [1, 0, 0], { v: 2 });
  assert.equal(m.all('acme').length, 2, 'default appends both rows');
});

test('registerKit: re-registering the same brand:version upserts (no duplicates)', () => {
  const noesis = makeNoesis();
  const designMemory = makeDesignMemory();
  registerKit({ brand: 'acme', version: 'v1', embedding: [1, 0, 0], noesis, designMemory });
  registerKit({ brand: 'acme', version: 'v1', embedding: [1, 0, 0], noesis, designMemory });
  assert.equal(noesis.stats().brand, 1, 'noesis brand lane holds one row');
  assert.equal(designMemory.all('acme').length, 1, 'design-memory holds one row for the brand');
});
