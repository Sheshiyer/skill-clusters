#!/usr/bin/env node
// skills-normalize.mjs — backfill recommended frontmatter (cluster, version) into SKILL.md files.
//
// Derives each skill's cluster from skills.sh.json (a grouping's <cluster>-orchestrator names the
// cluster handle; a handle that prefixes the skill name wins for shared skills). Inserts
// `cluster:` and `version:` just before the closing `---` if absent. Idempotent; never overwrites.
//
//   node scripts/skills-normalize.mjs            # apply
//   node scripts/skills-normalize.mjs --dry-run  # preview
//   node scripts/skills-normalize.mjs --version 1.0.0 --origin "affaan-m/ECC (MIT)" --only <name,...>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO, 'skills');
const MANIFEST = path.join(REPO, 'skills.sh.json');

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const getOpt = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const VERSION = getOpt('--version') || '1.0.0';
const ORIGIN = getOpt('--origin'); // optional
const ONLY = getOpt('--only') ? new Set(getOpt('--only').split(',')) : null;

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

// build skill -> cluster handle
const clusterOf = {};
for (const g of manifest.groupings || []) {
  const orch = (g.skills || []).find((s) => s.endsWith('-orchestrator'));
  const handle = orch ? orch.replace(/-orchestrator$/, '') : g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const s of g.skills || []) {
    // prefix-preference: a handle that prefixes the skill name wins for shared skills
    if (clusterOf[s] === undefined || s.startsWith(handle + '-') || s === handle) clusterOf[s] = handle;
  }
}

function insertKeys(text, kv) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const fmBlock = text.slice(0, end); // includes opening --- up to (not incl) closing
  const rest = text.slice(end); // starts at "\n---"
  const additions = Object.entries(kv)
    .filter(([k]) => !new RegExp(`^${k}:`, 'm').test(fmBlock))
    .map(([k, v]) => `${k}: ${v}`);
  if (!additions.length) return null; // nothing to add
  return fmBlock + '\n' + additions.join('\n') + rest;
}

let changed = 0;
const skills = fs.readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
for (const name of skills) {
  if (ONLY && !ONLY.has(name)) continue;
  const file = path.join(SKILLS_DIR, name, 'SKILL.md');
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const kv = {};
  if (clusterOf[name]) kv.cluster = clusterOf[name];
  kv.version = VERSION;
  if (ORIGIN) kv.origin = `"${ORIGIN}"`;
  const next = insertKeys(text, kv);
  if (next && next !== text) {
    changed++;
    if (dry) console.log(`  would normalize ${name}  (cluster: ${kv.cluster || '-'}, version: ${VERSION})`);
    else fs.writeFileSync(file, next);
  }
}
console.log(`${dry ? '[dry-run] ' : ''}normalized ${changed} skill(s)`);
