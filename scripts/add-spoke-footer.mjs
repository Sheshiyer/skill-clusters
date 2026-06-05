#!/usr/bin/env node
// add-spoke-footer.mjs — append a standard "Loading spokes on demand" section to every
// <cluster>-orchestrator/SKILL.md that lacks it. Needed for the hub-deploy debloat model:
// spokes aren't enumerated, so the orchestrator tells the agent where to Read them.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILLS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills');
const MARKER = '## Loading spokes on demand';
const FOOTER = `

${MARKER}

To keep CLI startup context lean, this cluster's spokes are **not** separately registered as skills — only this orchestrator and its \`*-core\` are enumerated. When you route to a spoke named above, **load it on demand** by reading its file:

\`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md\`  (or \`skills/<spoke-name>/SKILL.md\` inside the skill-clusters repo).
`;

let n = 0;
for (const d of fs.readdirSync(SKILLS)) {
  if (!d.endsWith('-orchestrator')) continue;
  const f = path.join(SKILLS, d, 'SKILL.md');
  if (!fs.existsSync(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (t.includes(MARKER)) continue;
  fs.writeFileSync(f, t.replace(/\s*$/, '') + FOOTER);
  n += 1;
}
console.log(`added spoke-loading footer to ${n} orchestrator(s)`);
