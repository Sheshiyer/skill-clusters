// store-fs.mjs — the zero-dependency on-disk store that makes design-memory / noesis DURABLE.
//
// design-memory.mjs and noesis.mjs default to an in-memory Map per brand/namespace, so records die
// with the process. This is the persistent twin: a DROP-IN replacement for makeMemoryStore that backs
// the same { get(key) -> rows[], set(key, rows) } seam with a JSON file. Swap makeMemoryStore() for
// makeFileStore(path) and the records survive across processes — no other change to the federation
// or design-memory logic above the seam.
//
//   makeFileStore(filePath) -> {
//     get(key)        -> rows[]   // the stored array for key, or [] if unknown (matches makeMemoryStore)
//     set(key, rows)              // store rows under key, then persist the whole state atomically
//   }
//
// MIRRORS makeJsonlStore (idempotency.mjs): an in-memory Map is BOTH the per-process cache AND the
// thing reconstructed from the file on construction, so a fresh instance in a new process recovers its
// state purely from disk. The difference is the seam shape — get/set here (design-memory), not
// has/get/put (the idempotency ledger).
//
// On-disk format: one JSON object { [key]: rows[] } — minimal and human-diffable. Writes are atomic:
// the WHOLE map is written to a uniquely-named temp file in the SAME dir, then renameSync replaces the
// target (a same-filesystem rename is atomic, so a reader never sees a half-written file).
//
// Zero dependencies: node:fs / node:path only. Synchronous, matching the house style.

import fs from 'node:fs';
import path from 'node:path';

// Process-wide counter so concurrent sets (even within one process) never collide on a temp name.
let tmpSeq = 0;

export function makeFileStore(filePath) {
  // The in-memory mirror: key -> rows[]. Hydrated from the file on construction (if it exists), then
  // kept in lock-step with disk on every set. get() reads from here so the caller's get->push->set
  // mutation contract (used by makeDesignMemory.add / makeNoesis.add) persists the pushed row.
  const byKey = new Map();

  // Load existing records if the file is there; otherwise start empty. A torn/empty file (e.g. a
  // crashed write, or JSON.parse('')) is tolerated as "empty" rather than fatal — mirrors the
  // torn-line tolerance in makeJsonlStore. Construction touches disk only to read; it never writes,
  // so merely constructing a store creates no file or directory (lazy FS).
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        for (const [key, rows] of Object.entries(parsed)) {
          if (Array.isArray(rows)) byKey.set(key, rows);
        }
      }
    } catch {
      // empty/torn/corrupt file → start empty rather than fail the whole load
    }
  }

  // Serialize the entire map and replace the target file atomically: ensure the parent dir exists,
  // write the JSON to a uniquely-named temp file IN THE SAME DIR (so the rename is same-filesystem
  // and therefore atomic), then renameSync over filePath. A crashed write leaves at most an orphan
  // *.tmp, never a half-written data file.
  function persist() {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const obj = Object.fromEntries(byKey);
    const tmp = path.join(dir, `${path.basename(filePath)}.${process.pid}.${tmpSeq++}.${Math.random().toString(36).slice(2)}.tmp`);
    fs.writeFileSync(tmp, JSON.stringify(obj));
    fs.renameSync(tmp, filePath);
  }

  return {
    // The stored array for key, or a fresh [] for an unknown key — identical to makeMemoryStore.
    // Returns the LIVE array so `const rows = store.get(k); rows.push(row); store.set(k, rows)` works.
    get: (key) => byKey.get(key) || [],

    // Store rows under key, then durably persist the whole state. Read-then-write of whole rows,
    // exactly as makeMemoryStore — the only addition is the atomic flush to disk.
    set: (key, rows) => {
      byKey.set(key, rows);
      persist();
    },
  };
}
