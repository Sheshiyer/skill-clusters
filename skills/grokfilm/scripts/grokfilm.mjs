#!/usr/bin/env node
// grokfilm.mjs — search the local GrokFilm technique index (visual cortex film layer).
// Source: https://grokfilm.app/#index (Tetsuo Corp / AgenC). Cached under taste/corpus/grokfilm/.
//
//   node grokfilm.mjs search "dutch angle chiaroscuro"
//   node grokfilm.mjs get dutch-angle
//   node grokfilm.mjs prompt "noir lobby" --mood Dramatic --limit 3
//   node grokfilm.mjs categories
//   node grokfilm.mjs refresh   # re-fetch data.js from grokfilm.app
//
// Emits prompt language for Grok Imagine / Higgsfield / scroll-world / brandmint stills.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const CORPUS = path.join(REPO, 'taste/corpus/grokfilm');
const TECH_PATH = path.join(CORPUS, 'techniques.json');
const SOURCE_URL = 'https://grokfilm.app/data.js';

const argv = process.argv.slice(2);
const cmd = argv[0] || 'help';
const asJson = argv.includes('--json');
const getOpt = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
};
const limit = Number(getOpt('--limit') || 8);
const mood = getOpt('--mood');
const category = getOpt('--category') || getOpt('--cat');
const difficulty = getOpt('--difficulty') || getOpt('--diff');

function load() {
  if (!fs.existsSync(TECH_PATH)) {
    console.error(`missing ${TECH_PATH} — run: node grokfilm.mjs refresh`);
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(TECH_PATH, 'utf8'));
}

function tokens(s) {
  return (String(s).toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1);
}

function firstSentence(def) {
  const m = String(def || '').match(/^[^.!?]+[.!?]?/);
  return (m ? m[0] : def || '').trim();
}

function score(tech, qTokens) {
  if (!qTokens.length) return 0;
  const hay = tokens([tech.name, tech.definition, tech.category, tech.mood, tech.slug, tech.difficulty].join(' '));
  let s = 0;
  for (const t of qTokens) {
    if (tech.slug === t || tech.name.toLowerCase() === t) s += 40;
    else if (tech.name.toLowerCase().includes(t)) s += 18;
    else if (tech.slug.includes(t)) s += 12;
    if (tech.category?.toLowerCase() === t) s += 10;
    if (tech.mood?.toLowerCase() === t) s += 8;
    if (hay.includes(t)) s += 3;
  }
  return s;
}

function filterAll(techs, { mood, category, difficulty } = {}) {
  return techs.filter((t) => {
    if (mood && t.mood?.toLowerCase() !== mood.toLowerCase()) return false;
    if (category && t.category?.toLowerCase() !== category.toLowerCase()) return false;
    if (difficulty && t.difficulty?.toLowerCase() !== difficulty.toLowerCase()) return false;
    return true;
  });
}

function toPrompt(t, styleExtra = '') {
  const first = firstSentence(t.definition);
  const base = `Cinematic film still using the ${t.name} technique. ${first}`;
  const tail = styleExtra
    ? ` ${styleExtra}`
    : ' Film grain, disciplined composition, production still quality.';
  return `${base}${tail}`.replace(/\s+/g, ' ').trim();
}

function search(data, query) {
  const qTokens = tokens(query);
  let list = filterAll(data.techniques, { mood, category, difficulty });
  if (qTokens.length) {
    list = list
      .map((t) => ({ ...t, score: score(t, qTokens) }))
      .filter((t) => t.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  } else {
    list = list.map((t) => ({ ...t, score: 0 })).sort((a, b) => a.name.localeCompare(b.name));
  }
  return list.slice(0, limit);
}

function getBySlug(data, slug) {
  const s = slug.toLowerCase();
  return data.techniques.find((t) => t.slug === s || t.name.toLowerCase() === s) || null;
}

function refresh() {
  return new Promise((resolve, reject) => {
    https.get(SOURCE_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${SOURCE_URL}`));
        res.resume();
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const m = body.match(/const TECHNIQUES\s*=\s*(\[.*\])\s*;/s);
          if (!m) throw new Error('TECHNIQUES array not found in data.js');
          const arr = JSON.parse(m[1]);
          const out = {
            source: 'https://grokfilm.app/#index',
            origin: 'TETSUO CORP / AgenC Cinématique — Vol. 01',
            license_note: 'Technique catalogue mirrored for local operator use; attribute GrokFilm / Tetsuo Corp when shipping public work.',
            fetched: new Date().toISOString().slice(0, 10),
            count: arr.length,
            fields: ['name', 'definition', 'category', 'difficulty', 'mood', 'slug', 'video?'],
            prompt_template: 'Cinematic film still using the {name} technique. {definition_first_sentence} …',
            techniques: arr,
          };
          fs.mkdirSync(CORPUS, { recursive: true });
          fs.writeFileSync(TECH_PATH, JSON.stringify(out, null, 2) + '\n');
          const slim = arr.map((t) => ({
            name: t.name, category: t.category, difficulty: t.difficulty, mood: t.mood, slug: t.slug,
          }));
          fs.writeFileSync(path.join(CORPUS, 'index.json'), JSON.stringify({ count: slim.length, techniques: slim }, null, 2) + '\n');
          resolve(out.count);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// fix accidental indent= in write above if I typo - use null,2 properly in write
// Actually I wrote JSON.stringify(out, indent = 2) which is wrong JS - indent becomes 2 as second arg value assignment returns 2. Wait:
// JSON.stringify(out, indent = 2) evaluates indent=2 which assigns 2 to indent, and the expression value is 2, so second arg is 2 which is replacer number - that might space-indent wrongly.
// JSON.stringify(value, replacer, space) - if replacer is number 2, it's treated as space! Actually in JSON.stringify, if second arg is number it is NOT space - space is third. If second is number, it's invalid replacer and ignored... Let me check ECMAScript - if typeof replacer is number, it's not a function so treated as null. So output might be minified.
// Fix refresh function and re-run convert for techniques if needed.

async function main() {
  if (cmd === 'help' || cmd === '-h' || cmd === '--help') {
    console.log(`grokfilm — visual cortex film technique index
  search <query> [--mood X] [--category Camera] [--difficulty Basic] [--limit N] [--json]
  get <slug|name> [--json]
  prompt <query> [--mood X] [--limit N] [--json]   # ranked techniques + prompt language
  categories [--json]
  refresh
Source: https://grokfilm.app/#index
Corpus: ${TECH_PATH}`);
    process.exit(0);
  }

  if (cmd === 'refresh') {
    const n = await refresh();
    console.log(`refreshed ${n} techniques → ${TECH_PATH}`);
    process.exit(0);
  }

  const data = load();

  if (cmd === 'categories') {
    const cats = {};
    for (const t of data.techniques) cats[t.category] = (cats[t.category] || 0) + 1;
    if (asJson) console.log(JSON.stringify({ count: data.count, categories: cats, source: data.source }, null, 2));
    else {
      console.log(`# GrokFilm · ${data.count} techniques · ${data.source}`);
      for (const [k, v] of Object.entries(cats).sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(3)}  ${k}`);
    }
    process.exit(0);
  }

  if (cmd === 'get') {
    const key = argv.slice(1).filter((a) => !a.startsWith('--')).join(' ');
    const t = getBySlug(data, key);
    if (!t) { console.error('not found:', key); process.exit(1); }
    if (asJson) console.log(JSON.stringify({ ...t, prompt: toPrompt(t), url: `https://grokfilm.app/#${t.slug}` }, null, 2));
    else {
      console.log(`# ${t.name} · ${t.category} · ${t.difficulty} · ${t.mood}`);
      console.log(t.definition);
      console.log('');
      console.log('prompt:', toPrompt(t));
      console.log('url:   ', `https://grokfilm.app/#${t.slug}`);
    }
    process.exit(0);
  }

  if (cmd === 'search' || cmd === 'prompt') {
    const query = argv.slice(1).filter((a) => !a.startsWith('--') && a !== getOpt('--limit') && a !== mood && a !== category && a !== difficulty).join(' ');
    const hits = search(data, query);
    if (asJson) {
      console.log(JSON.stringify({
        query, count: hits.length, source: data.source,
        hits: hits.map((t) => ({
          name: t.name, slug: t.slug, category: t.category, difficulty: t.difficulty, mood: t.mood, score: t.score,
          prompt: toPrompt(t),
          url: `https://grokfilm.app/#${t.slug}`,
          definition: t.definition,
        })),
      }, null, 2));
    } else {
      console.log(`# grokfilm ${cmd}: ${query || '(all)'} · ${hits.length} hits · ${data.source}`);
      for (const t of hits) {
        console.log(`\n## ${t.name}  [${t.category} · ${t.difficulty} · ${t.mood}]  score=${t.score || 0}`);
        if (cmd === 'prompt') console.log(toPrompt(t));
        else console.log(firstSentence(t.definition));
        console.log(`→ https://grokfilm.app/#${t.slug}`);
      }
      if (!hits.length) console.log('(no hits — try broader query or: node grokfilm.mjs categories)');
    }
    process.exit(0);
  }

  console.error('unknown command:', cmd);
  process.exit(2);
}

main().catch((e) => { console.error(e.message || e); process.exit(2); });
