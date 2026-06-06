// load-env.mjs — populate process.env for NIM vars from the user's env files, IN-PROCESS only.
//
// Side-effect import. We do NOT shell-source (that's blocked for good reason + leaks to subprocesses);
// instead we read known env files inside this Node process and set ONLY the missing NIM-relevant vars.
// Values are never logged. Already-set env vars always win (so an explicit export overrides the file).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));         // taste/scripts/lib
const repoEnv = path.resolve(here, '../../../.env');              // skill-clusters/.env (the new account)

// repo .env FIRST so the new account's key is preferred, then the home env files
const CANDIDATES = [
  repoEnv,
  path.join(os.homedir(), '.claude/.env'),
  path.join(os.homedir(), '.hermes/.env'),
  path.join(os.homedir(), '.codex/.env'),
  path.join(os.homedir(), '.env'),
];
const WANT = [
  'NVIDIA_NIM_API_KEY', 'NVIDIA_API_KEY', 'NIM_API_KEY', 'NIM_KEYS',   // the key pool (primary first)
  'NVIDIA_NIM_API_URL', 'NIM_BASE_URL', 'NIM_VLM_MODEL', 'NIM_EMBED_MODEL', 'NIM_CLIP_MODEL',
  'INFERENCE_SH_API_KEY', 'INFERENCE_API_KEY',                         // a possible future lane (different provider)
];

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

export const loadedFrom = [];
for (const f of CANDIDATES) {
  if (!fs.existsSync(f)) continue;
  let kv;
  try { kv = parseEnv(fs.readFileSync(f, 'utf8')); } catch { continue; }
  let used = false;
  for (const k of WANT) if (!process.env[k] && kv[k]) { process.env[k] = kv[k]; used = true; }
  if (used) loadedFrom.push(f);
}
