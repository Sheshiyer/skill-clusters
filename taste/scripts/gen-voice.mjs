#!/usr/bin/env node
// gen-voice.mjs — the generic brandmint voice/tone capability (issue #27).
//
//   node taste/scripts/gen-voice.mjs <brand-spec.json> [out.md]
//
// Turns a CANONICAL brand-spec (the validated contract emitted by brandmint — schema at
// taste/schemas/brand-spec.schema.json) into a Markdown VOICE & TONE GUIDE, DETERMINISTICALLY:
// no AI, no network, no spend. It is the verbal sibling of gen-logo.mjs (which renders the
// visual half): same pure-core + isMain-CLI shape, but it reads `voice_tokens`
// (tone/vocabulary/dos/donts) + `persona.who` + `identity` instead of the palette.
//
// genVoiceGuide() is the PURE core (brand-spec in → one Markdown string out): no I/O, no network,
// no mutation of its input — so it's unit-testable like the wing's other pure cores (genLogo,
// emitBrandSpec). The file write lives behind main().

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isStr, asArr, oneLine } from './lib/brand-tokens.mjs';

// ---- small helpers --------------------------------------------------------

// isStr · asArr · oneLine → ./lib/brand-tokens.mjs (shared with gen-positioning).

// Capitalize the first visible character (for "Direct, confident…" tone phrasing).
function cap(s) {
  const t = oneLine(s);
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

// Render an array as a Markdown bullet list, or a single fallback line when empty.
function bullets(arr, fallback) {
  const items = asArr(arr);
  if (!items.length) return `_${fallback}_`;
  return items.map((i) => `- ${i}`).join('\n');
}

// Join a list of tone adjectives into readable prose: "a, b and c".
function andList(arr) {
  const a = asArr(arr);
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  return `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
}

// Pull the brand's verbal primitives out of a (possibly under-specified) spec, with safe
// fallbacks — so the body builder below never touches a possibly-undefined nested field.
function voiceTokens(spec = {}) {
  const identity = spec.identity || {};
  const vt = spec.voice_tokens || {};
  const persona = spec.persona || {};
  const name = isStr(identity.name) ? identity.name.trim() : (isStr(spec.brand) ? spec.brand.trim() : 'The brand');
  return {
    name,
    tagline: isStr(identity.tagline) ? oneLine(identity.tagline) : '',
    mission: isStr(identity.mission) ? oneLine(identity.mission) : '',
    tone: asArr(vt.tone),
    vocabulary: asArr(vt.vocabulary),
    dos: asArr(vt.dos),
    donts: asArr(vt.donts),
    who: isStr(persona.who) ? oneLine(persona.who) : '',
    pains: asArr(persona.pains),
    gains: asArr(persona.gains),
  };
}

// Build 2–3 generic→on-brand rewrites from the tone + name, so it works for ANY spec
// (never hardcoded to one brand). Each pair shows a flat generic line rewritten in-voice.
function exampleRewrites(t) {
  const toneLead = t.tone.length ? cap(t.tone[0]) : 'On-brand';
  const tonePair = andList(t.tone.slice(0, 3)) || 'the brand voice';
  const firstGain = t.gains[0] ? oneLine(t.gains[0]).replace(/\.+$/, '') : 'real results';
  const rows = [
    {
      generic: 'We offer a solution that may help your business.',
      onBrand: `${t.name} ${t.gains[0] ? `gets you to "${firstGain.toLowerCase()}"` : 'delivers the outcome you came for'} — no fluff.`,
    },
    {
      generic: 'Our innovative platform leverages cutting-edge technology.',
      onBrand: `Here's exactly what it does, and here's the proof.`,
    },
    {
      generic: 'Please consider reaching out to learn more at your convenience.',
      onBrand: `See it on your own ${isStr(t.who) ? 'store' : 'product'} this week. Want in?`,
    },
  ];
  return { toneLead, tonePair, rows };
}

// ── genVoiceGuide (PURE) ─────────────────────────────────────────────────────────────────────
// brand-spec → a Markdown voice & tone guide string. No I/O, no network, no mutation of `spec`.
export function genVoiceGuide(spec) {
  const t = voiceTokens(spec);
  const L = []; // lines

  L.push(`# ${t.name} — Voice & Tone Guide`);
  if (t.tagline) L.push('', `> ${t.tagline}`);
  L.push('', `_Deterministically generated from the canonical brand-spec (\`voice_tokens\` + \`persona\` + \`identity\`)._`);

  // Tone
  L.push('', '## Tone', '');
  if (t.tone.length) {
    L.push(`${t.name} sounds **${andList(t.tone)}**. Every sentence should carry at least one of these qualities.`, '');
    L.push(...t.tone.map((adj) => `- **${cap(adj)}**`));
  } else {
    L.push(bullets(t.tone, 'No tone tokens defined — keep copy clear, direct and on-message.'));
  }

  // Do / Don't
  L.push('', '## Do / Don\'t', '', '### Do', '');
  L.push(bullets(t.dos, 'No explicit do-rules — default to leading with the outcome.'));
  L.push('', '### Don\'t', '');
  L.push(bullets(t.donts, 'No explicit don\'t-rules — default to avoiding hype and vague claims.'));

  // Vocabulary
  L.push('', '## Vocabulary', '');
  if (t.vocabulary.length) {
    L.push('On-brand words and terms of art to prefer:', '');
    L.push(bullets(t.vocabulary, ''));
  } else {
    L.push(`_No fixed vocabulary list yet — favor the plain, concrete nouns your ${isStr(t.who) ? t.who.toLowerCase() : 'audience'} already uses, not jargon._`);
  }

  // Writing for {persona.who}
  const audience = isStr(t.who) ? t.who : 'your audience';
  L.push('', `## Writing for ${audience}`, '');
  if (isStr(t.who)) {
    L.push(`You are writing for **${t.who}**. Meet them where they are:`, '');
  } else {
    L.push('No persona is defined on this spec. Default to a pragmatic, time-poor decision-maker:', '');
  }
  L.push('**Speak to these pains:**', '');
  L.push(bullets(t.pains, 'No pains recorded — ask what is costing them time or money, and address it head-on.'));
  L.push('', '**Promise these gains:**', '');
  L.push(bullets(t.gains, 'No gains recorded — promise a concrete, measurable outcome rather than a feeling.'));

  // Example rewrites
  const ex = exampleRewrites(t);
  L.push('', '## Example rewrites', '');
  L.push(`Generic, off-brand copy rewritten in a ${ex.tonePair} voice:`, '');
  L.push('| Generic | On-brand |', '| --- | --- |');
  for (const r of ex.rows) {
    L.push(`| ${r.generic} | ${r.onBrand} |`);
  }

  return L.join('\n') + '\n';
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────
function main() {
  const [specPath, outPath] = process.argv.slice(2);
  if (!specPath) {
    console.error('usage: gen-voice.mjs <brand-spec.json> [out.md]');
    process.exit(2);
  }
  if (!fs.existsSync(specPath)) {
    console.error(`  brand-spec not found: ${specPath}`);
    process.exit(2);
  }
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (e) {
    console.error(`  brand-spec is not valid JSON (${specPath}): ${e.message}`);
    process.exit(2);
  }

  const md = genVoiceGuide(spec);
  if (outPath) {
    try {
      fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
      fs.writeFileSync(outPath, md);
    } catch (e) {
      console.error(`  cannot write ${outPath}: ${e.message}`);
      process.exit(2);
    }
    const name = (spec.identity && spec.identity.name) || spec.brand || 'Brand';
    console.log(`  ✓ ${name}: wrote voice & tone guide → ${outPath}`);
  } else {
    process.stdout.write(md);
  }
}

// Run the CLI only when invoked directly — importing the module (e.g. from tests) is side-effect-free.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
