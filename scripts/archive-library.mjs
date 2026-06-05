#!/usr/bin/env node
// archive-library.mjs — move now-clustered / folded / bundle / one-off skills OUT of the
// scanned dir (~/.agents/skills) into ~/.agents/skills-archive/, for context debloat.
// KEEPS: symlinks (the active cluster hubs deployed by tier.mjs) + the Bucket-C "always-on"
// set (PAI/personal, process/meta, skill-tooling, GSD) + dotfiles. Everything else moves.
// Reversible: records a manifest; run with --restore to move everything back.
//
//   node scripts/archive-library.mjs            # dry-run (default)
//   node scripts/archive-library.mjs --apply
//   node scripts/archive-library.mjs --restore --apply

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const AGENTS = path.join(os.homedir(), '.agents', 'skills');
const ARCHIVE = path.join(os.homedir(), '.agents', 'skills-archive');
const MANIFEST = path.join(ARCHIVE, '.archived.json');
const APPLY = process.argv.includes('--apply');
const RESTORE = process.argv.includes('--restore');

// Bucket C — always-on, never archive (cross-cutting personal + process + tooling).
const KEEP = new Set([
  // PAI / personal infra
  'pai', 'core', 'paiupgrade', 'telos', 'noesis', 'chronicle', 'camsnap', 'songsee', 'things-mac',
  'obsidian', 'obsidian-vault', 'apple-notes', 'apple-reminders', 'witnessos-logic-extractor',
  'somatic-canticles-narrative-weaver', 'peon-ping-config', 'peon-ping-log', 'peon-ping-toggle',
  'peon-ping-use', 'pattern-synthesizer',
  // process / reasoning / meta
  'brainstorming', 'firstprinciples', 'iterativedepth', 'systemsthinking', 'redteam', 'ideate',
  'council', 'delegation', 'thinking', 'ultrathink', 'interview', 'privateinvestigator',
  'executing-plans', 'writing-plans', 'writing-skills', 'using-git-worktrees',
  'subagent-driven-development', 'verification-before-completion', 'receiving-code-review',
  'requesting-code-review', 'finishing-a-development-branch', 'dispatching-parallel-agents',
  'using-superpowers', 'extractwisdom', 'becreative', 'prompting', 'prompt-guard', 'science',
  'rootcauseanalysis', 'systematic-debugging', 'test-driven-development', 'worldthreatmodelharness',
  // skill / agent tooling
  'find-skills', 'createskill', 'createcli', 'skill-scanner', 'skill-share', 'template-skill',
  'mcp-builder', 'mcporter', 'agents', 'skill-creator', 'clawhub', 'utilities',
  // GSD source-commands
  'source-command-gsd-join-discord', 'source-command-gsd-reapply-patches',
  'source-command-gsd-review-backlog', 'source-command-gsd-workstreams',
]);

if (RESTORE) {
  let moved = 0;
  let list = [];
  try { list = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).archived || []; } catch {}
  for (const name of list) {
    const from = path.join(ARCHIVE, name), to = path.join(AGENTS, name);
    if (fs.existsSync(from) && !fs.existsSync(to)) { if (APPLY) fs.renameSync(from, to); moved++; }
  }
  console.log(`${APPLY ? '' : '[dry-run] '}restore: ${moved} skill(s) back to ~/.agents/skills`);
  process.exit(0);
}

fs.mkdirSync(ARCHIVE, { recursive: true });
const toArchive = [];
for (const name of fs.readdirSync(AGENTS)) {
  if (name.startsWith('.')) continue;
  const p = path.join(AGENTS, name);
  let st;
  try { st = fs.lstatSync(p); } catch { continue; }
  if (st.isSymbolicLink()) continue;     // active cluster hub — keep
  if (!st.isDirectory()) continue;
  if (KEEP.has(name)) continue;          // Bucket C — keep
  toArchive.push(name);
}

const prev = (() => { try { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).archived || []; } catch { return []; } })();
for (const name of toArchive) {
  if (APPLY) fs.renameSync(path.join(AGENTS, name), path.join(ARCHIVE, name));
}
if (APPLY) fs.writeFileSync(MANIFEST, JSON.stringify({ archived: [...new Set([...prev, ...toArchive])] }, null, 2));

const remain = fs.readdirSync(AGENTS).filter((n) => !n.startsWith('.')).length;
console.log(`${APPLY ? '' : '[dry-run] '}archive: ${toArchive.length} skill(s) -> ~/.agents/skills-archive/`);
console.log(`  ~/.agents/skills would retain: ${APPLY ? remain : remain - toArchive.length} entries (active hubs + Bucket-C always-on)`);
console.log(`  sample archived: ${toArchive.slice(0, 12).join(', ')}…`);
