#!/usr/bin/env node
// audit-refs.mjs — scan the ACTIVE ~/.claude config (hooks, PAI, agents, commands, settings,
// CLAUDE.md) for hardcoded `.agents/skills/<name>` paths that point at a skill which is no
// longer there (archived / clustered-away). Those are STALE links that can error at runtime.
// Reports each with its resolution from skill-index.json. Exit 1 if any stale ref found.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const AGENTS = path.join(HOME, '.agents', 'skills');

// what's actually present in the scanned dir right now (symlinks + real dirs)
const present = new Set(fs.existsSync(AGENTS) ? fs.readdirSync(AGENTS).filter((n) => !n.startsWith('.')) : []);
let index = { skills: {} };
try { index = JSON.parse(fs.readFileSync(path.join(REPO, 'skill-index.json'), 'utf8')); } catch {}

// active config roots to scan (skip logs/caches/transcripts)
const ROOTS = ['hooks', 'PAI', 'agents', 'commands'].map((d) => path.join(HOME, '.claude', d))
  .concat([path.join(HOME, '.claude', 'settings.json'), path.join(HOME, '.claude', 'settings.local.json'), path.join(HOME, '.claude', 'CLAUDE.md')]);
const SKIP = /node_modules|plugins\/cache|\.bak$|skills-archive|\/MEMORY\/|\/projects\//;
const EXT = /\.(ts|js|mjs|json|md|sh)$/;
const RE = /[.~]?\/?\.agents\/skills\/([a-z0-9][a-z0-9-]*)\b/g;

function* files(p) {
  let st; try { st = fs.statSync(p); } catch { return; }
  if (SKIP.test(p)) return;
  if (st.isDirectory()) { for (const c of fs.readdirSync(p)) yield* files(path.join(p, c)); }
  else if (EXT.test(p)) yield p;
}

const stale = [];
for (const root of ROOTS) {
  for (const f of files(root)) {
    let text; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    let m;
    while ((m = RE.exec(text))) {
      const name = m[1];
      if (present.has(name)) continue;            // still there → fine
      const e = index.skills?.[name];
      const where = e ? `${e.status}${e.cluster ? ` (cluster ${e.cluster})` : ''} → ${e.activate || e.restore || 'Read ' + e.path}` : 'UNKNOWN skill (not in index)';
      stale.push({ file: f.replace(HOME, '~'), name, where });
    }
  }
}

if (!stale.length) {
  console.log('✓ audit-refs: no stale `.agents/skills/<name>` links in active ~/.claude config');
  process.exit(0);
}
console.log(`✖ audit-refs: ${stale.length} stale skill reference(s):`);
for (const s of stale) console.log(`   ${s.file}\n     → ${s.name}: ${s.where}`);
process.exit(1);
