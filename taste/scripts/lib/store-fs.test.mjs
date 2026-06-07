// store-fs.test.mjs — the zero-dep on-disk store that makes design-memory / noesis durable.
// Run: node --test taste/scripts/lib/store-fs.test.mjs
//
// makeFileStore(filePath) is a DROP-IN for makeMemoryStore: same { get(key)->rows[], set(key,rows) }
// seam, but backed by a JSON file written atomically (temp + renameSync). These tests prove the seam
// matches makeMemoryStore, the file round-trips across instances/processes, the write is atomic (no
// temp leftovers), and the store works underneath BOTH makeDesignMemory and makeNoesis.

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { makeFileStore } from './store-fs.mjs';
import { makeMemoryStore, makeDesignMemory } from './design-memory.mjs';
import { makeNoesis } from './noesis.mjs';

// --- helpers ---------------------------------------------------------------------------------------

// Documentary 4-dim vectors (cosine works at any equal length; the real corpus is 1024-dim).
const v = (...xs) => xs;

// A fresh, unique temp dir per call under os.tmpdir(). Returns { dir, file, cleanup }. cleanup is
// idempotent and recursive — every test wraps its body in try/finally so no tmp state leaks.
function freshFile(name = 'store.json') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'store-fs-test-'));
  const file = path.join(dir, name);
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
  return { dir, file, cleanup };
}

// The sibling temp files makeFileStore creates mid-write must never survive a completed set().
const tmpSiblings = (dir, file) =>
  fs.readdirSync(dir).filter((n) => n !== path.basename(file) && n.includes('.tmp'));

// =====================================================================================================
// Interface parity — makeFileStore is a drop-in for makeMemoryStore
// =====================================================================================================

test('makeFileStore exposes get and set methods (ISC-1..3)', () => {
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    assert.equal(typeof s.get, 'function', 'get is a function');
    assert.equal(typeof s.set, 'function', 'set is a function');
  } finally {
    cleanup();
  }
});

test('get(key) returns [] for an unknown key (ISC-4)', () => {
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    assert.deepEqual(s.get('nobody'), []);
  } finally {
    cleanup();
  }
});

test('set(key, rows) then get(key) returns those rows (ISC-5)', () => {
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    const rows = [{ id: 'a', vector: v(1, 0, 0, 0), meta: { label: 'a' } }];
    s.set('x', rows);
    assert.deepEqual(s.get('x'), rows);
  } finally {
    cleanup();
  }
});

test('get returns the live array so push-then-set persists (ISC-6)', () => {
  // This is the exact mutation contract makeDesignMemory.add / makeNoesis.add rely on:
  //   const rows = store.get(k); rows.push(row); store.set(k, rows);
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    const rows = s.get('x');            // fresh [] for an unknown key
    rows.push({ id: 'a', vector: v(1, 0, 0, 0), meta: {} });
    s.set('x', rows);
    assert.equal(s.get('x').length, 1);
    // a second read-then-write appends, not replaces
    const rows2 = s.get('x');
    rows2.push({ id: 'b', vector: v(0, 1, 0, 0), meta: {} });
    s.set('x', rows2);
    assert.deepEqual(s.get('x').map((r) => r.id), ['a', 'b']);
  } finally {
    cleanup();
  }
});

test('distinct keys are isolated (ISC-7)', () => {
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    s.set('x', [{ id: 'a', vector: v(1, 0, 0, 0), meta: {} }]);
    s.set('y', [{ id: 'b', vector: v(0, 1, 0, 0), meta: {} }]);
    assert.deepEqual(s.get('x').map((r) => r.id), ['a']);
    assert.deepEqual(s.get('y').map((r) => r.id), ['b']);
  } finally {
    cleanup();
  }
});

test('get(key).length works as a pure read — noesis.stats() path (ISC-8)', () => {
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    assert.equal(s.get('x').length, 0);
    s.set('x', [{ id: 'a', vector: v(1, 0, 0, 0), meta: {} }]);
    assert.equal(s.get('x').length, 1);
  } finally {
    cleanup();
  }
});

// =====================================================================================================
// Construction / file loading
// =====================================================================================================

test('constructing on a non-existent file starts empty, throws nothing (ISC-9)', () => {
  const { file, cleanup } = freshFile();
  try {
    assert.equal(fs.existsSync(file), false, 'precondition: file absent');
    let s;
    assert.doesNotThrow(() => { s = makeFileStore(file); });
    assert.deepEqual(s.get('anything'), []);
  } finally {
    cleanup();
  }
});

test('constructing on an existing JSON file loads its records (ISC-10)', () => {
  const { dir, file, cleanup } = freshFile();
  try {
    // hand-write a valid on-disk shape, then construct over it
    fs.mkdirSync(dir, { recursive: true });
    const onDisk = { x: [{ id: 'a', vector: v(1, 0, 0, 0), meta: { seeded: true } }] };
    fs.writeFileSync(file, JSON.stringify(onDisk));
    const s = makeFileStore(file);
    assert.deepEqual(s.get('x'), onDisk.x);
  } finally {
    cleanup();
  }
});

test('mere construction does not create the file (lazy dirs) (ISC-11)', () => {
  // Point at a nested path whose parent dir does not exist; constructing must not create it.
  const { dir, cleanup } = freshFile();
  try {
    const nested = path.join(dir, 'deep', 'nested', 'store.json');
    makeFileStore(nested);
    assert.equal(fs.existsSync(nested), false, 'construction must not write the file');
    assert.equal(fs.existsSync(path.dirname(nested)), false, 'construction must not create dirs');
  } finally {
    cleanup();
  }
});

// =====================================================================================================
// Atomic persistence
// =====================================================================================================

test('set creates the target file on disk (ISC-12)', () => {
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    s.set('x', [{ id: 'a', vector: v(1, 0, 0, 0), meta: {} }]);
    assert.equal(fs.existsSync(file), true);
  } finally {
    cleanup();
  }
});

test('set creates parent dirs recursively before writing (ISC-14)', () => {
  const { dir, cleanup } = freshFile();
  try {
    const nested = path.join(dir, 'a', 'b', 'c', 'store.json');
    const s = makeFileStore(nested);
    s.set('x', [{ id: 'a', vector: v(1, 0, 0, 0), meta: {} }]);
    assert.equal(fs.existsSync(nested), true, 'nested file written');
    assert.equal(fs.existsSync(path.dirname(nested)), true, 'nested dirs created');
  } finally {
    cleanup();
  }
});

test('set leaves no temp file behind in the dir — atomic via rename (ISC-13, ISC-15)', () => {
  const { dir, file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    s.set('x', [{ id: 'a', vector: v(1, 0, 0, 0), meta: {} }]);
    s.set('y', [{ id: 'b', vector: v(0, 1, 0, 0), meta: {} }]);
    assert.deepEqual(tmpSiblings(dir, file), [], 'no *.tmp sibling survives a completed set');
    // exactly the data file remains
    assert.deepEqual(fs.readdirSync(dir), [path.basename(file)]);
  } finally {
    cleanup();
  }
});

test('on-disk JSON parses back to exactly the records that were set (ISC-16)', () => {
  const { file, cleanup } = freshFile();
  try {
    const s = makeFileStore(file);
    const xs = [{ id: 'a', vector: v(1, 0, 0, 0), meta: { label: 'a' } }];
    const ys = [{ id: 'b', vector: v(0, 1, 0, 0), meta: { label: 'b' } }];
    s.set('x', xs);
    s.set('y', ys);
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(parsed, { x: xs, y: ys });
  } finally {
    cleanup();
  }
});

// =====================================================================================================
// Persistence round-trip — cross-process durability (the whole point)
// =====================================================================================================

test('a second makeFileStore on the same path sees the first instance records (ISC-17, ISC-18)', () => {
  const { file, cleanup } = freshFile();
  try {
    const first = makeFileStore(file);
    first.set('x', [
      { id: 'a', vector: v(1, 0, 0, 0), meta: { label: 'a' } },
      { id: 'b', vector: v(0, 1, 0, 0), meta: { label: 'b' } },
    ]);

    // a brand-new instance, as if a fresh process — reconstructs state purely from the file
    const second = makeFileStore(file);
    assert.equal(second.get('x').length, 2, 'second instance sees durably-written rows');
    assert.deepEqual(second.get('x').map((r) => r.id), ['a', 'b']);
    assert.deepEqual(
      second.get('x'),
      first.get('x'),
      'second instance rows equal what the first set',
    );
  } finally {
    cleanup();
  }
});

// =====================================================================================================
// Parity vs in-memory makeMemoryStore — identical behavior for the same op sequence
// =====================================================================================================

test('same op sequence yields identical get results: file vs memory (ISC-19, ISC-20)', () => {
  const { file, cleanup } = freshFile();
  try {
    const mem = makeMemoryStore();
    const fileS = makeFileStore(file);

    // unknown-key parity
    assert.deepEqual(fileS.get('x'), mem.get('x'));

    // run the SAME read-then-write sequence against both
    for (const store of [mem, fileS]) {
      const r1 = store.get('x'); r1.push({ id: 'a', vector: v(1, 0, 0, 0), meta: { i: 1 } }); store.set('x', r1);
      const r2 = store.get('x'); r2.push({ id: 'b', vector: v(0, 1, 0, 0), meta: { i: 2 } }); store.set('x', r2);
      const r3 = store.get('y'); r3.push({ id: 'c', vector: v(0, 0, 1, 0), meta: { i: 3 } }); store.set('y', r3);
    }

    assert.deepEqual(fileS.get('x'), mem.get('x'), 'brand x matches memory store');
    assert.deepEqual(fileS.get('y'), mem.get('y'), 'brand y matches memory store');
    assert.deepEqual(fileS.get('z'), mem.get('z'), 'unknown brand z matches ([] both)');
  } finally {
    cleanup();
  }
});

// =====================================================================================================
// design-memory integration — makeDesignMemory({ store: makeFileStore(file) })
// =====================================================================================================

test('makeDesignMemory over a fileStore: add then query finds the record (ISC-21)', () => {
  const { file, cleanup } = freshFile();
  try {
    const m = makeDesignMemory({ store: makeFileStore(file) });
    m.add('acme', 'logo-1', v(1, 0, 0, 0), { kind: 'logo' });
    const [top] = m.query('acme', v(1, 0, 0, 0), 1);
    assert.equal(top.id, 'logo-1');
    assert.deepEqual(top.meta, { kind: 'logo' });
  } finally {
    cleanup();
  }
});

test('design-memory recalls an added record after a full reload (ISC-22, ISC-23)', () => {
  const { file, cleanup } = freshFile();
  try {
    // write through one store+memory
    const m1 = makeDesignMemory({ store: makeFileStore(file) });
    m1.add('acme', 'logo-1', v(0.9, 0.1, 0, 0), { kind: 'logo' });
    m1.add('acme', 'logo-2', v(0, 1, 0, 0), { kind: 'logo' });

    // brand-new store + brand-new memory over the same file (fresh process simulation)
    const m2 = makeDesignMemory({ store: makeFileStore(file) });
    const hits = m2.query('acme', v(1, 0, 0, 0), 5);
    assert.equal(hits.length, 2, 'query recalls persisted rows after reload');
    assert.equal(hits[0].id, 'logo-1', 'closest vector ranked first, recalled from disk');
    assert.equal(m2.all('acme').length, 2, 'all(brand) returns persisted rows after reload');
  } finally {
    cleanup();
  }
});

// =====================================================================================================
// noesis integration — makeNoesis({ stores: { <ns>: makeFileStore(file) } })
// =====================================================================================================

test('makeNoesis over fileStores: add then query finds the record in a namespace (ISC-24)', () => {
  const { file, cleanup } = freshFile();
  try {
    const noesis = makeNoesis({ stores: { brand: makeFileStore(file) } });
    noesis.add('brand', 'b1', v(1, 0, 0, 0), { src: 'design-memory' });
    const [top] = noesis.query('brand', v(1, 0, 0, 0), 1);
    assert.equal(top.id, 'b1');
    assert.equal(top.namespace, 'brand');
  } finally {
    cleanup();
  }
});

test('noesis recalls a persisted record via queryAll + stats after reload (ISC-25, ISC-26)', () => {
  // one file per namespace so each lane is independently durable
  const brandF = freshFile('brand.json');
  const tasteF = freshFile('taste.json');
  try {
    const n1 = makeNoesis({
      stores: { brand: makeFileStore(brandF.file), taste: makeFileStore(tasteF.file) },
    });
    n1.add('brand', 'b1', v(1, 0, 0, 0), { src: 'brand' });
    n1.add('taste', 't1', v(0, 1, 0, 0), { src: 'taste' });

    // fresh stores + fresh noesis over the same files (fresh process simulation)
    const n2 = makeNoesis({
      stores: { brand: makeFileStore(brandF.file), taste: makeFileStore(tasteF.file) },
    });
    const all = n2.queryAll(v(1, 0, 0, 0), 5);
    assert.ok(all.some((r) => r.id === 'b1' && r.namespace === 'brand'), 'brand record recalled across-namespace');
    assert.ok(all.some((r) => r.id === 't1' && r.namespace === 'taste'), 'taste record recalled across-namespace');

    const stats = n2.stats();
    assert.equal(stats.brand, 1, 'stats reflects persisted brand count after reload');
    assert.equal(stats.taste, 1, 'stats reflects persisted taste count after reload');
  } finally {
    brandF.cleanup();
    tasteF.cleanup();
  }
});
