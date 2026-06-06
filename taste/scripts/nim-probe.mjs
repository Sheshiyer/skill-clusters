#!/usr/bin/env node
// nim-probe.mjs — discover which providers/keys/models are reachable, so we can route work
// without overloading one key. Reads keys in-process (never shell-sourced); prints NO secret values.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// in-process env load from repo .env + the home env files
const FILES = [
  path.resolve('.env'),
  path.join(os.homedir(), '.claude/.env'),
  path.join(os.homedir(), '.hermes/.env'),
];
const env = { ...process.env };
for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (env[m[1]] === undefined) env[m[1]] = v;
  }
}

const PROVIDERS = [
  { name: 'nim-new @ integrate (PRIMARY?)', key: env.NVIDIA_NIM_API_KEY, url: 'https://integrate.api.nvidia.com/v1' },
  { name: 'nim-new @ configured .env url', key: env.NVIDIA_NIM_API_KEY, url: (env.NVIDIA_NIM_API_URL || '').replace(/\/$/, '') },
  { name: 'nim-old @ integrate', key: env.NVIDIA_API_KEY, url: 'https://integrate.api.nvidia.com/v1' },
  { name: 'inference.sh @ /v1', key: env.INFERENCE_SH_API_KEY || env.INFERENCE_API_KEY, url: 'https://api.inference.sh/v1' },
  { name: 'inference.sh @ root', key: env.INFERENCE_SH_API_KEY || env.INFERENCE_API_KEY, url: 'https://api.inference.sh' },
];

for (const p of PROVIDERS) {
  console.log(`\n=== ${p.name}  ·  ${p.url}  ·  key:${p.key ? 'present(' + p.key.slice(0, 6) + '…)' : 'MISSING'} ===`);
  if (!p.key) continue;
  try {
    const r = await fetch(p.url + '/models', { headers: { Authorization: 'Bearer ' + p.key, Accept: 'application/json' } });
    console.log(`  GET /models → ${r.status}`);
    if (r.ok) {
      const j = await r.json();
      const ids = (j.data || j.models || []).map((m) => m.id || m.name || m).filter(Boolean);
      const vision = ids.filter((i) => /vision|vlm|vila|llava|phi-3.*vision|nvclip/i.test(i));
      const embed = ids.filter((i) => /embed|nvclip|nv-embed/i.test(i));
      console.log(`  total models: ${ids.length}`);
      console.log(`  vision/VLM   : ${vision.slice(0, 12).join(', ') || '— none visible'}`);
      console.log(`  embeddings   : ${embed.slice(0, 12).join(', ') || '— none visible'}`);
      console.log(`  sample       : ${ids.slice(0, 10).join(', ')}`);
    } else {
      console.log('  body:', (await r.text()).slice(0, 180));
    }
  } catch (e) { console.log('  error:', e.message); }
}
