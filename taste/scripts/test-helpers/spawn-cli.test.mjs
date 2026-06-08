// spawn-cli.test.mjs — the shared subprocess-CLI test helper. spawnCli runs `node <script> <args>`
// and returns spawnSync's captured result ({ status, stdout, stderr } as strings).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawnCli } from './spawn-cli.mjs';

// A known CLI in the tree to exercise the helper against (kit-register: exit 2 on bad args, 0 on good).
const KITREG = fileURLToPath(new URL('../kit-register.mjs', import.meta.url));
const FIXTURE = fileURLToPath(new URL('../__fixtures__/sample-prototype.json', import.meta.url));

test('spawnCli captures status + stderr on a failing CLI', () => {
  const r = spawnCli(KITREG, []); // no args → exit 2 + usage on stderr
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage:/);
});

test('spawnCli captures stdout on a successful CLI', () => {
  const kit = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-'));
  fs.writeFileSync(path.join(kit, 'version.txt'), 'v9');
  const r = spawnCli(KITREG, [FIXTURE, kit]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /registered demobrand kit/);
});
