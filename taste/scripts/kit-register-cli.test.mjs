// kit-register-cli.test.mjs — the kit-register CLI contract + the --persist durability path.
//
// main() calls process.exit(), so these are SUBPROCESS tests: each spawns `node kit-register.mjs …`
// and asserts the exit code + stdout/stderr. The 6 exit-2 cases + the success case CHARACTERIZE the
// existing CLI (they lock the contract). The --persist cases are TDD for the new persistence flag —
// strictly additive, so the default path stays byte-identical.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawnCli } from './test-helpers/spawn-cli.mjs';

const SCRIPT = fileURLToPath(new URL('./kit-register.mjs', import.meta.url));
const FIXTURE = fileURLToPath(new URL('./__fixtures__/sample-prototype.json', import.meta.url));

const run = (args) => spawnCli(SCRIPT, args);
const tmp = (p = 'kr-') => fs.mkdtempSync(path.join(os.tmpdir(), p));
function kitDir(version = 'abc123def456') {
  const d = tmp('kr-kit-');
  if (version !== null) fs.writeFileSync(path.join(d, 'version.txt'), version);
  return d;
}
function protoFile(contents) {
  const f = path.join(tmp('kr-proto-'), 'proto.json');
  fs.writeFileSync(f, typeof contents === 'string' ? contents : JSON.stringify(contents));
  return f;
}

// ── 6 exit-2 cases (characterize the CLI's error contract) ────────────────────────────────────────
test('CLI exit 2: no args → usage', () => {
  const r = run([]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage:/);
});
test('CLI exit 2: only the prototype, missing kitDir → usage', () => {
  const r = run([FIXTURE]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage:/);
});
test('CLI exit 2: prototype file does not exist', () => {
  const r = run(['/no/such/prototype.json', kitDir()]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /kit-register:/);
});
test('CLI exit 2: prototype is invalid JSON', () => {
  const r = run([protoFile('{ not valid json'), kitDir()]);
  assert.equal(r.status, 2);
});
test('CLI exit 2: prototype has no .prototype array', () => {
  const r = run([protoFile({ brand: 'x' }), kitDir()]);
  assert.equal(r.status, 2);
});
test('CLI exit 2: prototype has no .brand string', () => {
  const r = run([protoFile({ prototype: [1, 0, 0] }), kitDir()]);
  assert.equal(r.status, 2);
});

// ── success path (characterize) ───────────────────────────────────────────────────────────────────
test('CLI exit 0: registers the kit + prints recall + census', () => {
  const r = run([FIXTURE, kitDir('99f0deadbeef')]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /registered demobrand kit \(version 99f0deadbeef\)/);
  assert.match(r.stdout, /noesis\[brand\]\s+→ demobrand:99f0deadbeef\s+score=1\.0000/);
  assert.match(r.stdout, /design-memory\s+→ demobrand:99f0deadbeef\s+score=1\.0000/);
  assert.match(r.stdout, /noesis census:\s+\{"taste":0,"brand":1,"knowledge":0\}/);
});
test('CLI: version is "unknown" when version.txt is absent', () => {
  const r = run([FIXTURE, kitDir(null)]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /version unknown/);
});

// ── --persist (TDD: durable registration) ─────────────────────────────────────────────────────────
test('CLI --persist: writes noesis-brand.json + design-memory.json into the dir', () => {
  const pdir = tmp('kr-persist-');
  const r = run([FIXTURE, kitDir('persisted01'), '--persist', pdir]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(pdir, 'noesis-brand.json')), 'noesis-brand.json written');
  assert.ok(fs.existsSync(path.join(pdir, 'design-memory.json')), 'design-memory.json written');
});
test('CLI --persist: the persisted noesis file contains the brand record', () => {
  const pdir = tmp('kr-persist-');
  run([FIXTURE, kitDir('persisted02'), '--persist', pdir]);
  const data = JSON.parse(fs.readFileSync(path.join(pdir, 'noesis-brand.json'), 'utf8'));
  assert.ok(Array.isArray(data.brand), 'brand lane is an array of rows');
  assert.ok(data.brand.some((row) => row.id === 'demobrand:persisted02'), 'the kit record is on disk');
});
test('CLI --persist: prints a "persisted →" confirmation line', () => {
  const pdir = tmp('kr-persist-');
  const r = run([FIXTURE, kitDir(), '--persist', pdir]);
  assert.match(r.stdout, /persisted →/);
});
test('CLI --persist: a fresh store reading the dir recalls the kit (durability)', async () => {
  const pdir = tmp('kr-persist-');
  run([FIXTURE, kitDir('persisted03'), '--persist', pdir]);
  const { makeFileStore } = await import('./lib/store-fs.mjs');
  const { makeNoesis } = await import('./lib/noesis.mjs');
  const proto = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const fresh = makeNoesis({ stores: { brand: makeFileStore(path.join(pdir, 'noesis-brand.json')) } });
  const hits = fresh.query('brand', proto.prototype, 1);
  assert.equal(hits[0].id, 'demobrand:persisted03', 'recalled from disk by a brand-new store instance');
  assert.ok(hits[0].score > 0.99);
});
test('CLI default (no --persist): writes no store files', () => {
  const kit = kitDir();
  const r = run([FIXTURE, kit]);
  assert.equal(r.status, 0);
  assert.ok(!fs.existsSync(path.join(kit, 'noesis-brand.json')), 'no store file beside the kit');
  assert.doesNotMatch(r.stdout, /persisted →/, 'no persist line in the default path');
});

test('CLI --persist re-run: re-registering the same kit leaves one row (upsert — no dup)', () => {
  const pdir = tmp('kr-persist-');
  const kit = kitDir('rerun01');
  run([FIXTURE, kit, '--persist', pdir]);
  run([FIXTURE, kit, '--persist', pdir]); // identical brand:version into the same dir
  const data = JSON.parse(fs.readFileSync(path.join(pdir, 'noesis-brand.json'), 'utf8'));
  const rows = data.brand.filter((r) => r.id === 'demobrand:rerun01');
  assert.equal(rows.length, 1, 'two identical --persist runs leave exactly one row on disk');
});
