// kit-register.test.mjs — proves kit-register wires a brand kit into the REAL local memories.
//
// Strict TDD: this file is written BEFORE kit-register.mjs and observed failing (module-not-found)
// before any implementation exists. It uses the actual makeNoesis() / makeDesignMemory() instances
// (NOT mocks) so a green run proves the real integration end to end — a record added through
// registerKit is recallable by cosine from both the noesis `brand` lane and the design-memory store.

import test from 'node:test';
import assert from 'node:assert/strict';

import { makeNoesis } from './lib/noesis.mjs';
import { makeDesignMemory } from './lib/design-memory.mjs';
import { registerKit } from './kit-register.mjs';

// A tiny, on-axis embedding stands in for the 1024-dim brand prototype. Cosine only needs the
// vectors to be comparable, so [1,0,0] is enough to prove recall ranks the real record first.
const EMBEDDING = [1, 0, 0];
const BRAND = 'acme';
const VERSION = 'v1';

// Build a fresh pair of REAL stores for each test so cases never bleed into each other.
function freshStores() {
  return { noesis: makeNoesis(), designMemory: makeDesignMemory() };
}

test('registerKit returns the noesis + design-memory ids it created', () => {
  const { noesis, designMemory } = freshStores();

  const ids = registerKit({ brand: BRAND, version: VERSION, embedding: EMBEDDING, noesis, designMemory });

  assert.ok(ids && typeof ids === 'object', 'returns an object');
  assert.equal(typeof ids.noesisId, 'string', 'has a string noesisId');
  assert.equal(typeof ids.designMemoryId, 'string', 'has a string designMemoryId');
  // Stable, derivable id so a re-register targets the same logical record.
  assert.equal(ids.noesisId, `${BRAND}:${VERSION}`, 'noesisId is brand:version');
  assert.equal(ids.designMemoryId, `${BRAND}:${VERSION}`, 'designMemoryId is brand:version');
});

test('noesis brand-namespace recalls the registered kit as the top hit', () => {
  const { noesis, designMemory } = freshStores();

  registerKit({ brand: BRAND, version: VERSION, embedding: EMBEDDING, noesis, designMemory });

  // Same embedding → the record must come back first, with the brand/version/kind metadata intact.
  const hits = noesis.query('brand', EMBEDDING, 5);
  assert.ok(hits.length >= 1, 'at least one hit in the brand lane');

  const top = hits[0];
  assert.equal(top.id, `${BRAND}:${VERSION}`, 'top hit is the registered kit');
  assert.equal(top.namespace, 'brand', 'hit is tagged with the brand namespace');
  assert.ok(top.score > 0.99, 'identical vector scores ~1');
  assert.equal(top.meta.brand, BRAND, 'meta carries brand');
  assert.equal(top.meta.version, VERSION, 'meta carries version');
  assert.equal(top.meta.kind, 'brand-kit', "meta carries kind 'brand-kit'");
});

test('design-memory recalls the registered kit for the brand', () => {
  const { noesis, designMemory } = freshStores();

  registerKit({ brand: BRAND, version: VERSION, embedding: EMBEDDING, noesis, designMemory });

  const hits = designMemory.query(BRAND, EMBEDDING, 5);
  assert.ok(hits.length >= 1, 'at least one hit for the brand');

  const top = hits[0];
  assert.equal(top.id, `${BRAND}:${VERSION}`, 'top hit is the registered kit');
  assert.ok(top.score > 0.99, 'identical vector scores ~1');
  assert.equal(top.meta.kind, 'brand-kit', "meta carries kind 'brand-kit'");
  assert.equal(top.meta.brand, BRAND, 'meta carries brand');
});

test('extra meta is merged but brand/version/kind are not overwritten', () => {
  const { noesis, designMemory } = freshStores();

  registerKit({
    brand: BRAND,
    version: VERSION,
    embedding: EMBEDDING,
    meta: { palette: 'sunset', kind: 'should-not-win' },
    noesis,
    designMemory,
  });

  const top = noesis.query('brand', EMBEDDING, 1)[0];
  assert.equal(top.meta.palette, 'sunset', 'caller meta is preserved');
  assert.equal(top.meta.kind, 'brand-kit', "kind stays 'brand-kit' even if caller passes another");
  assert.equal(top.meta.brand, BRAND, 'brand is authoritative');
  assert.equal(top.meta.version, VERSION, 'version is authoritative');
});

test('the record lands in the brand lane only, not taste or knowledge', () => {
  const { noesis, designMemory } = freshStores();

  registerKit({ brand: BRAND, version: VERSION, embedding: EMBEDDING, noesis, designMemory });

  const census = noesis.stats();
  assert.equal(census.brand, 1, 'one record in the brand lane');
  assert.equal(census.taste, 0, 'taste lane untouched');
  assert.equal(census.knowledge, 0, 'knowledge lane untouched');
});
