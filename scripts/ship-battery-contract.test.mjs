import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function fixture(contract) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ship-contract-'));
  fs.writeFileSync(path.join(dir, 'contract.json'), JSON.stringify(contract, null, 2));
  return dir;
}

test('ship-battery validates a complete Cambium variable contract', () => {
  const dir = fixture({
    brand_system: { archetype: 'saas-ai' },
    copy_system: { slots: { hero_headline: 'Compile the company' } },
    visual_system: { palette: ['#111111', '#f8f8f8'] },
    asset_plan: { required: ['hero_media'] },
    section_plan: ['hero', 'proof'],
    interaction_plan: { motion: 'subtle' },
    acceptance_checks: ['on-brand palette + type'],
  });

  const out = execFileSync('node', ['scripts/ship-battery.mjs', '--dir', dir, '--contract', 'contract.json', '--json'], { cwd: root, encoding: 'utf8' });
  const json = JSON.parse(out);
  assert.equal(json.gates.find((gate) => gate.name === 'variable-contract').status, 'pass');
});

test('ship-battery fails closed when required contract groups are missing', () => {
  const dir = fixture({
    brand_system: { archetype: 'saas-ai' },
    copy_system: { slots: {} },
  });

  const result = spawnSync('node', ['scripts/ship-battery.mjs', '--dir', dir, '--contract', 'contract.json', '--json'], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  const json = JSON.parse(result.stdout);
  const gate = json.gates.find((entry) => entry.name === 'variable-contract');
  assert.equal(gate.status, 'fail');
  assert.match(gate.detail, /asset_plan/);
  assert.match(gate.detail, /acceptance_checks/);
});
