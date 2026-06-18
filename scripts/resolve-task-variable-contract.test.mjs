import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

test('resolve-task preserves rich variable-contract hints on dispatch items', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-clusters-contract-'));
  const tasks = path.join(dir, 'tasks.md');
  fs.writeFileSync(tasks, [
    '# Tasks',
    '',
    '- [ ] T001 Build a luxury-editorial hero section with logo, motion, and CTA copy',
    '- [ ] T002 Add a pricing table UI screenshot for the proof section',
    '',
  ].join('\n'));

  const out = execFileSync('node', ['scripts/resolve-task.mjs', tasks, '--json'], { cwd: root, encoding: 'utf8' });
  const json = JSON.parse(out);
  const hero = json.plan.find((task) => task.id === 'T001');
  const pricing = json.plan.find((task) => task.id === 'T002');

  assert.equal(hero.contract.section_type, 'hero');
  assert.equal(hero.contract.brand_archetype, 'luxury-editorial');
  assert.ok(hero.contract.asset_requirements.includes('hero_media'));
  assert.ok(hero.contract.asset_requirements.includes('logo'));
  assert.ok(hero.contract.copy_slots.includes('hero_headline'));
  assert.equal(pricing.contract.section_type, 'pricing');
  assert.ok(pricing.contract.asset_requirements.includes('pricing_table'));
  assert.ok(pricing.contract.asset_requirements.includes('ui_screenshot'));
});
