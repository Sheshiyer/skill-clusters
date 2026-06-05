#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const distIndex = args.indexOf('--dist');
const DIST_DIR = distIndex >= 0 ? args[distIndex + 1] : 'dist';

const rawMarkdownMarkers = [
  { label: 'bold emphasis marker', pattern: /\*\*/ },
  { label: 'single emphasis marker', pattern: /(^|[\s([{"'])\*[^*\s][^*]{1,120}[^*\s]\*(?=$|[\s)\]},.!?:;"'])/ },
  { label: 'markdown link marker', pattern: /\]\(/ },
  { label: 'fenced code marker', pattern: /```/ },
  { label: 'frontmatter delimiter', pattern: /^---\s/m },
];

const publicCopyBans = [
  { label: 'placeholder source copy', pattern: /No source outputs were available/i },
  { label: 'placeholder structured copy', pattern: /No structured content available/i },
  { label: 'todo placeholder', pattern: /\b(TODO|TBD|lorem ipsum)\b/i },
  { label: 'internal raw artifact label', pattern: /Raw artifact path/i },
  { label: 'local filesystem path', pattern: /\/Volumes\/|\/Users\/|file:\/\//i },
  { label: 'internal wave label', pattern: /Wave\s+[0-9]+/i },
  { label: 'internal output label', pattern: /Brandmint outputs|generated outputs|raw outputs/i },
  { label: 'internal current run label', pattern: /current run/i },
  { label: 'stale launch build label', pattern: /current launch build/i },
  { label: 'stale launch run label', pattern: /latest launch run/i },
  { label: 'stale generated artifact label', pattern: /generated artifacts/i },
];

const emojiUiPattern = /[\u{1F300}-\u{1FAFF}]/u;

function findHtmlFiles(dir, files = []) {
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      findHtmlFiles(path, files);
    } else if (item.endsWith('.html')) {
      files.push(path);
    }
  }
  return files;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

if (!existsSync(DIST_DIR)) {
  console.error(`Public HTML verification failed: ${DIST_DIR}/ does not exist. Run the build first.`);
  process.exit(1);
}

const htmlFiles = findHtmlFiles(DIST_DIR);
const errors = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const text = visibleText(html);
  const relativeFile = file.replace(`${DIST_DIR}/`, '');

  for (const marker of rawMarkdownMarkers) {
    if (marker.pattern.test(text)) {
      errors.push(`Raw ${marker.label} visible in ${relativeFile}`);
    }
  }

  for (const banned of publicCopyBans) {
    if (banned.pattern.test(text)) {
      errors.push(`Public copy regression (${banned.label}) in ${relativeFile}`);
    }
  }

  if (emojiUiPattern.test(text)) {
    errors.push(`Emoji character visible in public HTML text for ${relativeFile}`);
  }
}

console.log(`Checked ${htmlFiles.length} HTML files in ${DIST_DIR}/`);

if (errors.length > 0) {
  console.error(`\nPublic HTML verification failed (${errors.length}):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Public HTML verification passed');
