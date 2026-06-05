#!/usr/bin/env node
// crawl-codrops.mjs — P0 corpus tracer for the je-ne-sais-quoi taste engine.
//
// Politely pulls recent Codrops posts from the RSS feed, fetches each article for its og:image
// (the curated demo preview — our multi-modal visual signal), the live demo URL, and the source
// (code) link, then writes structured rows to taste/corpus/taste-corpus.jsonl + downloads the
// preview images to taste/corpus/shots/. VLM enrichment + embeddings are added by enrich.mjs /
// the embedder (NIM-gated) — this script needs no API key.
//
//   node taste/scripts/crawl-codrops.mjs [--limit 20] [--feed <url>]
//
// Respectful: identifies itself, rate-limits between requests, records Codrops attribution,
// stores only links to source code (never bulk-copies repos). Personal training use.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WING = path.resolve(__dirname, '..');                 // skill-clusters/taste
const CORPUS = path.join(WING, 'corpus');
const SHOTS = path.join(CORPUS, 'shots');
const OUT = path.join(CORPUS, 'taste-corpus.jsonl');

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const LIMIT = parseInt(opt('--limit', '20'), 10);
const FEED = opt('--feed', 'https://tympanus.net/codrops/feed/');
const UA = 'je-ne-sais-quoi taste-engine (personal research; +https://github.com/Sheshiyer/skill-clusters)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s || '')
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&#8217;|&#039;|&rsquo;/g, "'").replace(/&#8230;/g, '…')
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();
const slug = (url) => (url.match(/\/codrops\/\d{4}\/\d{2}\/\d{2}\/([^/]+)/)?.[1]
  || url.replace(/[^a-z0-9]+/gi, '-')).replace(/(^-|-$)/g, '').slice(0, 60);

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': as === 'buffer' ? '*/*' : 'text/html,application/xml' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.text();
}

// pull structured signals out of an article's HTML
function parseArticle(html) {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] || null;
  // demo link: a tympanus Development/demo URL, or an anchor whose text is "Demo"
  const demo = html.match(/href=["'](https?:\/\/tympanus\.net\/(?:Development|codrops\/demos)\/[^"']+)["']/i)?.[1]
    || html.match(/href=["']([^"']+)["'][^>]*>\s*(?:view\s+)?demo\s*</i)?.[1] || null;
  // code link: first GitHub repo or a downloadable zip
  const code = html.match(/href=["'](https?:\/\/github\.com\/[^"']+)["']/i)?.[1]
    || html.match(/href=["']([^"']+\.zip)["']/i)?.[1] || null;
  return { og, demo, code };
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  console.log(`\n  je-ne-sais-quoi · P0 corpus tracer`);
  console.log(`  feed: ${FEED}  ·  limit: ${LIMIT}\n  ${'-'.repeat(60)}`);

  // RSS returns ~10 posts/page — paginate (?paged=N) until we have LIMIT items
  let items = [];
  for (let page = 1; items.length < LIMIT && page <= 30; page++) {
    const pageUrl = page === 1 ? FEED : `${FEED}?paged=${page}`;
    let xml;
    try { xml = await get(pageUrl); } catch (e) { break; }
    const pageItems = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    if (!pageItems.length) break;
    items.push(...pageItems);
    if (page > 1) await sleep(700);
  }
  items = items.slice(0, LIMIT);
  if (!items.length) { console.error('  no items parsed from feed'); process.exit(1); }

  const rows = [];
  for (const [i, item] of items.entries()) {
    const url = clean(item.match(/<link>([\s\S]*?)<\/link>/)?.[1]);
    const title = clean(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const date = clean(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]);
    const tags = [...item.matchAll(/<category>([\s\S]*?)<\/category>/g)].map((m) => clean(m[1])).filter(Boolean);
    const excerpt = clean(item.match(/<description>([\s\S]*?)<\/description>/)?.[1]).slice(0, 280);
    if (!url) continue;
    const id = slug(url);

    let og = null, demo = null, code = null, shot = null;
    try {
      const html = await get(url);
      ({ og, demo, code } = parseArticle(html));
      if (og) {
        const ext = (og.match(/\.(png|jpe?g|webp|gif)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase();
        const buf = await get(og, 'buffer');
        shot = path.join('corpus/shots', `${id}.${ext}`);
        fs.writeFileSync(path.join(WING, shot), buf);
      }
    } catch (e) { console.log(`     · ${id}: article/img fetch failed (${e.message})`); }

    rows.push({
      url, title, tags, date, excerpt,
      demo_url: demo, code_url: code,
      screenshot: shot,
      taste_schema: null,        // ← filled by enrich.mjs (NIM VLM); null = pending
      embedding: null,           // ← filled by the embedder (NIM multimodal); null = pending
      source: 'codrops',
    });
    console.log(`  ${String(i + 1).padStart(2)}. ${id.padEnd(42).slice(0, 42)} ${shot ? '🖼' : '··'} ${tags.slice(0, 3).join(',')}`);
    await sleep(700);            // polite
  }

  fs.writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const withShot = rows.filter((r) => r.screenshot).length;
  console.log(`  ${'-'.repeat(60)}`);
  console.log(`  wrote ${rows.length} rows → ${path.relative(process.cwd(), OUT)}`);
  console.log(`  visuals: ${withShot}/${rows.length} previews · demo links: ${rows.filter((r) => r.demo_url).length} · code links: ${rows.filter((r) => r.code_url).length}`);
  console.log(`  next: set NVIDIA_API_KEY, then  node taste/scripts/enrich.mjs  (VLM taste_schema) + embed\n`);
}

main().catch((e) => { console.error('crawl failed:', e.message); process.exit(1); });
