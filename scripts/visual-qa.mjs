#!/usr/bin/env node
/**
 * visual-qa.mjs — reusable visual + accessibility QA for static pages.
 *
 * Zero extra dependencies beyond Playwright. ESM.
 *
 *   node scripts/visual-qa.mjs <file-or-url> [--widths 320,768,1280] [--out <dir>]
 *
 * For each width it screenshots the FULL page to <out>/shot-<width>.png, then runs
 * a computed-contrast audit (WCAG 2.x) at the 1280 viewport (or the widest one shot)
 * and writes <out>/contrast-report.json. Exits non-zero if any contrast failures, so
 * it can gate a build.
 *
 * Playwright resolution: this repo has no local/global `playwright`, but the package
 * is available in the npx cache with chromium binaries under ~/Library/Caches/ms-playwright.
 * We locate the package + a usable executable at runtime so the tool "just works".
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------------------
// arg parsing (manual, zero-dep)
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { target: null, widths: [320, 768, 1280], outDir: './qa' };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--widths') {
      out.widths = String(argv[++i] ?? '')
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
    } else if (a.startsWith('--widths=')) {
      out.widths = a.slice('--widths='.length)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
    } else if (a === '--out') {
      out.outDir = argv[++i] ?? out.outDir;
    } else if (a.startsWith('--out=')) {
      out.outDir = a.slice('--out='.length);
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    } else {
      rest.push(a);
    }
  }
  if (!out.target && rest.length) out.target = rest[0];
  if (!out.widths.length) out.widths = [320, 768, 1280];
  return out;
}

function usage() {
  return [
    'Usage: node scripts/visual-qa.mjs <file-or-url> [--widths 320,768,1280] [--out <dir>]',
    '',
    '  <file-or-url>   Local HTML file (converted to file://) or http(s) URL.',
    '  --widths        Comma-separated viewport widths. Default: 320,768,1280',
    '  --out           Output directory for screenshots + report. Default: ./qa',
    '',
    'Screenshots full page per width; runs a WCAG 2.x computed-contrast audit at the',
    'widest width; writes <out>/contrast-report.json; exits non-zero on any failure.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// resolve target -> URL
// ---------------------------------------------------------------------------
function resolveTargetUrl(target) {
  if (/^https?:\/\//i.test(target) || /^file:\/\//i.test(target)) return target;
  const abs = path.resolve(target);
  if (!existsSync(abs)) {
    throw new Error(`Target not found: ${target} (resolved ${abs})`);
  }
  return pathToFileURL(abs).href;
}

// ---------------------------------------------------------------------------
// resolve Playwright as a library (handles the npx-cache install)
// ---------------------------------------------------------------------------
function resolvePlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [];

  // 1) normal resolution (local node_modules / global) — works if installed there.
  try {
    candidates.push(require.resolve('playwright'));
  } catch { /* not resolvable from cwd */ }

  // 2) scan the npx cache (~/.npm/_npx/<hash>/node_modules/playwright/index.js)
  try {
    const npxRoot = path.join(homedir(), '.npm', '_npx');
    if (existsSync(npxRoot)) {
      for (const hash of readdirSync(npxRoot)) {
        const p = path.join(npxRoot, hash, 'node_modules', 'playwright', 'index.js');
        if (existsSync(p)) candidates.push(p);
      }
    }
  } catch { /* ignore */ }

  for (const entry of candidates) {
    try {
      // playwright's entry is CJS; require it directly to avoid ESM-interop surprises.
      const reqFromEntry = createRequire(entry);
      const mod = reqFromEntry(entry);
      const chromium = mod.chromium || (mod.default && mod.default.chromium);
      if (chromium && typeof chromium.launch === 'function') {
        return { chromium, entry };
      }
    } catch { /* try next candidate */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// find an installed chromium executable (full chromium or headless-shell)
// so we never trip over a revision-pin mismatch in the cached package.
// ---------------------------------------------------------------------------
function findChromiumExecutable() {
  const cacheRoot = path.join(homedir(), 'Library', 'Caches', 'ms-playwright');
  if (!existsSync(cacheRoot)) return null;
  const entries = readdirSync(cacheRoot);

  // Prefer full chromium (renders identically to a real browser); fall back to
  // chrome-headless-shell which is sufficient for layout + screenshots + DOM.
  const relPaths = [
    // full chromium
    ['chromium-', path.join('chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium')],
    // headless shell (mac arm64 / x64)
    ['chromium_headless_shell-', path.join('chrome-headless-shell-mac-arm64', 'chrome-headless-shell')],
    ['chromium_headless_shell-', path.join('chrome-headless-shell-mac-x64', 'chrome-headless-shell')],
  ];

  // sort revisions descending so we pick the newest installed build
  const byPrefix = (prefix) =>
    entries
      .filter((e) => e.startsWith(prefix))
      .sort((a, b) => {
        const na = parseInt(a.slice(prefix.length), 10) || 0;
        const nb = parseInt(b.slice(prefix.length), 10) || 0;
        return nb - na;
      });

  for (const [prefix, rel] of relPaths) {
    for (const dir of byPrefix(prefix)) {
      const exe = path.join(cacheRoot, dir, rel);
      if (existsSync(exe)) return exe;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// in-page contrast audit (runs inside the browser via page.evaluate)
// kept as a plain function and stringified so it has no Node closure deps.
// ---------------------------------------------------------------------------
function contrastAuditInPage() {
  // ---- color parsing / WCAG math (all in-page) ----
  function parseColor(str) {
    if (!str) return null;
    str = str.trim();
    if (str === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    let m = str.match(/^rgba?\(([^)]+)\)$/i);
    if (m) {
      const parts = m[1].split(/[, /]+/).filter(Boolean);
      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);
      const a = parts[3] != null ? parseFloat(parts[3]) : 1;
      if ([r, g, b].some((n) => Number.isNaN(n))) return null;
      return { r, g, b, a: Number.isNaN(a) ? 1 : a };
    }
    m = str.match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      if (h.length === 4) h = h.split('').map((c) => c + c).join('');
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  }

  // composite a (possibly translucent) foreground over an opaque background
  function composite(fg, bg) {
    const a = fg.a == null ? 1 : fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }

  function relLuminance({ r, g, b }) {
    const lin = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function contrastRatio(fg, bg) {
    const L1 = relLuminance(fg);
    const L2 = relLuminance(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Split a CSS background-image value into its comma-separated layers WITHOUT
  // splitting on the commas inside each gradient's rgba()/stop list.
  function splitBackgroundLayers(bgImage) {
    const layers = [];
    let depth = 0, start = 0;
    for (let i = 0; i < bgImage.length; i++) {
      const ch = bgImage[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        layers.push(bgImage.slice(start, i).trim());
        start = i + 1;
      }
    }
    layers.push(bgImage.slice(start).trim());
    return layers.filter(Boolean);
  }

  // Reduce ONE gradient layer to a representative {r,g,b,a}.
  //  - color channels: alpha-weighted mean of the stops (transparent stops add
  //    no tint), so a navy->tech base reads navy and an orange->transparent glow
  //    reads orange.
  //  - layer alpha: the MEAN stop alpha, which approximates the average coverage
  //    of the layer across the painted area. A fully-opaque base (alphas all 1)
  //    reads a=1 and anchors the walk; a translucent glow that fades to
  //    transparent (e.g. [0.2, 0]) reads a≈0.1, so it only faintly tints the
  //    anchor beneath it instead of dominating it. This keeps a navy section
  //    reading as navy rather than a warm mauve.
  function gradientLayerColor(layerStr) {
    if (!layerStr || layerStr === 'none') return null;
    if (/^url\(/i.test(layerStr)) return null; // raster image: can't sample from CSS
    const colorRe = /rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b/g;
    const matches = layerStr.match(colorRe);
    if (!matches || !matches.length) return null;
    let r = 0, g = 0, b = 0, aSum = 0, n = 0;
    for (const cstr of matches) {
      const c = parseColor(cstr);
      if (!c) continue;
      const a = c.a == null ? 1 : c.a;
      r += c.r * a;
      g += c.g * a;
      b += c.b * a;
      aSum += a;
      n++;
    }
    if (n === 0 || aSum <= 0) return null;
    const meanAlpha = aSum / n;
    if (meanAlpha <= 0) return null;
    return { r: r / aSum, g: g / aSum, b: b / aSum, a: meanAlpha };
  }

  // Ordered list of paintable layers for one element, TOP-most first:
  // background-image layers (already top-to-bottom in CSS), then background-color.
  function elementBackgroundLayers(cs) {
    const out = [];
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      for (const l of splitBackgroundLayers(cs.backgroundImage)) {
        const col = gradientLayerColor(l);
        if (col && col.a > 0) out.push(col);
      }
    }
    const bc = parseColor(cs.backgroundColor);
    if (bc && bc.a > 0) out.push(bc);
    return out;
  }

  // walk ancestors until an opaque painted background is found (default white),
  // compositing translucent layers (both background-color and background-image).
  function effectiveBackground(el) {
    let node = el;
    const WHITE = { r: 255, g: 255, b: 255, a: 1 };
    let acc = null; // translucent layers seen so far (top-most first), composited
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      for (const layer of elementBackgroundLayers(cs)) {
        if (layer.a >= 1) {
          return acc ? composite(acc, layer) : layer; // opaque anchor reached
        }
        acc = acc ? composite(acc, layer) : layer;
      }
      node = node.parentElement;
    }
    return acc ? composite(acc, WHITE) : WHITE;
  }

  function isVisible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return true;
  }

  function snippet(s) {
    const t = s.replace(/\s+/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 40) : t;
  }

  function rgbStr(c) {
    const round = (n) => Math.round(n);
    if (c.a != null && c.a < 1) return `rgba(${round(c.r)}, ${round(c.g)}, ${round(c.b)}, ${c.a})`;
    return `rgb(${round(c.r)}, ${round(c.g)}, ${round(c.b)})`;
  }

  const failures = [];
  let audited = 0;
  const seen = new Set();

  // Only audit rendered body content. <title>/<meta> etc. live in <head> and
  // are never painted, but carry text nodes that would otherwise be flagged.
  const root = document.body || document.documentElement;
  const all = root.querySelectorAll('*');
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE', 'HEAD', 'META', 'LINK', 'TEMPLATE']);
  for (const el of all) {
    if (SKIP.has(el.tagName)) continue;
    if (!document.body || !document.body.contains(el)) continue;

    // only elements with a DIRECT, non-empty visible text node
    let directText = '';
    for (const child of el.childNodes) {
      if (child.nodeType === 3 /* TEXT_NODE */) {
        const v = child.nodeValue || '';
        if (v.trim().length) directText += v;
      }
    }
    if (!directText.trim()) continue;
    if (!isVisible(el)) continue;

    const cs = getComputedStyle(el);
    const fontPx = parseFloat(cs.fontSize) || 0;
    const weight = parseInt(cs.fontWeight, 10) || (cs.fontWeight === 'bold' ? 700 : 400);

    let fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = effectiveBackground(el);
    // composite translucent text over the resolved (opaque) background
    const fgC = fg.a != null && fg.a < 1 ? composite(fg, bg) : fg;

    const ratio = contrastRatio(fgC, bg);

    // large text: >=24px, OR >=18.66px AND weight>=700  -> 3.0; else 4.5
    const isLarge = fontPx >= 24 || (fontPx >= 18.66 && weight >= 700);
    const threshold = isLarge ? 3.0 : 4.5;

    audited++;

    const key = `${snippet(directText)}|${rgbStr(fgC)}|${rgbStr(bg)}|${fontPx}|${weight}`;
    if (ratio < threshold && !seen.has(key)) {
      seen.add(key);
      failures.push({
        text: snippet(directText),
        color: rgbStr(fg),
        effectiveColor: rgbStr(fgC),
        bg: rgbStr(bg),
        ratio: Math.round(ratio * 100) / 100,
        threshold,
        fontPx,
        weight,
        large: isLarge,
      });
    }
  }

  return { audited, failures };
}

// ---------------------------------------------------------------------------
// fallback: screenshot via the `npx playwright screenshot` CLI
// ---------------------------------------------------------------------------
async function screenshotViaCli(url, width, height, outPath) {
  const { spawnSync } = await import('node:child_process');
  const args = [
    '--no-install', 'playwright', 'screenshot',
    '--browser', 'chromium',
    '--full-page',
    '--viewport-size', `${width},${height}`,
    url, outPath,
  ];
  const res = spawnSync('npx', args, { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`npx playwright screenshot failed (${res.status}): ${(res.stderr || '').trim()}`);
  }
  return outPath;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.target) {
    console.log(usage());
    process.exit(opts.target ? 0 : 2);
  }

  const url = resolveTargetUrl(opts.target);
  const outDir = path.resolve(opts.outDir);
  mkdirSync(outDir, { recursive: true });

  const widths = [...new Set(opts.widths)].sort((a, b) => a - b);
  const height = 900;
  // audit at 1280 if present, else the widest width shot
  const auditWidth = widths.includes(1280) ? 1280 : widths[widths.length - 1];

  console.log(`visual-qa: target ${url}`);
  console.log(`visual-qa: widths ${widths.join(', ')} | out ${outDir} | audit @ ${auditWidth}px`);

  const pw = resolvePlaywright();
  const execPath = findChromiumExecutable();

  const shots = [];
  let auditResult = null;
  let invocation = null;

  if (pw) {
    invocation = `playwright library (${pw.entry})` + (execPath ? ` + executablePath ${execPath}` : '');
    console.log(`visual-qa: using ${invocation}`);
    const launchOpts = { headless: true };
    if (execPath) launchOpts.executablePath = execPath;

    let browser;
    try {
      browser = await pw.chromium.launch(launchOpts);
    } catch (e) {
      console.error(`visual-qa: library launch failed (${e.message.split('\n')[0]}); falling back to CLI for shots.`);
      browser = null;
    }

    if (browser) {
      try {
        for (const width of widths) {
          const page = await browser.newPage({ viewport: { width, height } });
          await page.goto(url, { waitUntil: 'networkidle' }).catch(async () => {
            await page.goto(url, { waitUntil: 'load' });
          });
          // settle web fonts so contrast reflects rendered text
          try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch { /* ignore */ }
          const shotPath = path.join(outDir, `shot-${width}.png`);
          await page.screenshot({ path: shotPath, fullPage: true });
          const size = statSync(shotPath).size;
          shots.push({ width, path: shotPath, bytes: size });
          console.log(`visual-qa: shot ${width}px -> ${shotPath} (${size} bytes)`);

          if (width === auditWidth) {
            auditResult = await page.evaluate(`(${contrastAuditInPage.toString()})()`);
          }
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
  }

  // CLI fallback for any shots not produced by the library path
  if (!shots.length) {
    invocation = invocation
      ? invocation + ' -> fell back to `npx playwright screenshot` CLI'
      : '`npx playwright screenshot` CLI';
    console.log('visual-qa: using CLI fallback for screenshots.');
    for (const width of widths) {
      const shotPath = path.join(outDir, `shot-${width}.png`);
      await screenshotViaCli(url, width, height, shotPath);
      const size = statSync(shotPath).size;
      shots.push({ width, path: shotPath, bytes: size });
      console.log(`visual-qa: shot ${width}px -> ${shotPath} (${size} bytes)`);
    }
  }

  // If we have no audit yet (CLI fallback path), run a dedicated evaluate pass.
  if (!auditResult && pw) {
    const launchOpts = { headless: true };
    if (execPath) launchOpts.executablePath = execPath;
    try {
      const browser = await pw.chromium.launch(launchOpts);
      const page = await browser.newPage({ viewport: { width: auditWidth, height } });
      await page.goto(url, { waitUntil: 'load' });
      try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch { /* ignore */ }
      auditResult = await page.evaluate(`(${contrastAuditInPage.toString()})()`);
      await browser.close();
    } catch (e) {
      console.error(`visual-qa: contrast audit pass failed: ${e.message.split('\n')[0]}`);
    }
  }

  if (!auditResult) {
    auditResult = { audited: 0, failures: [], error: 'contrast audit could not run (no usable browser binding)' };
  }

  // ---- report ----
  const report = {
    target: url,
    generatedAt: new Date().toISOString(),
    invocation,
    auditWidth,
    widths,
    screenshots: shots,
    audited: auditResult.audited,
    failureCount: auditResult.failures.length,
    failures: auditResult.failures,
    ...(auditResult.error ? { error: auditResult.error } : {}),
  };
  const reportPath = path.join(outDir, 'contrast-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // ---- summary ----
  console.log('');
  console.log('================ visual-qa summary ================');
  console.log(`widths shot       : ${shots.map((s) => `${s.width}px`).join(', ')}`);
  console.log(`text elements     : ${auditResult.audited} audited @ ${auditWidth}px`);
  console.log(`contrast failures : ${auditResult.failures.length}`);
  if (auditResult.failures.length) {
    for (const f of auditResult.failures) {
      console.log(
        `  ✗ "${f.text}"  ratio ${f.ratio} < ${f.threshold}  ` +
        `(${f.fontPx}px/${f.weight}${f.large ? ', large' : ''})  fg ${f.effectiveColor} on bg ${f.bg}`
      );
    }
  } else {
    console.log('  ✓ 0 failures');
  }
  console.log(`report            : ${reportPath}`);
  console.log('===================================================');

  if (auditResult.error) process.exit(3);
  process.exit(auditResult.failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('visual-qa: fatal:', err && err.stack ? err.stack : err);
  process.exit(2);
});
