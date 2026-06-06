// yaml-lite.mjs — a tiny, zero-dependency YAML-SUBSET parser for brandmint brand-config.yaml.
//
// Node ships no YAML parser and we may not add a dependency, so this covers EXACTLY the
// constructs a brand-config file uses — not all of YAML:
//   • 2-space-indent nested maps            • `- ` sequences (of scalars AND of maps)
//   • scalars: bare / "quoted" / 'quoted'   • numbers, true / false, null
//   • `# comments` (full-line and inline)   • blank lines
//   • `key: |` literal block scalars (multi-line strings)
// Anything outside this subset (flow maps, anchors, multi-doc, folded `>`, etc.) is out of scope.
//
//   import { parseYaml } from './yaml-lite.mjs'   ->   parseYaml(text) returns a JS object

// ---- scalar coercion ------------------------------------------------------
// A *quoted* scalar is always a string (quotes are how brand-config keeps "7" or "#FF6B35"
// from being coerced). A *bare* scalar is coerced: null / true / false / number / else string.
function coerceScalar(raw) {
  const s = raw.trim();
  if (s === '') return '';
  const q = s[0];
  if ((q === '"' || q === "'") && s[s.length - 1] === q && s.length >= 2) {
    return s.slice(1, -1); // quoted → literal string, no coercion
  }
  if (s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  // number: integer or float, optional sign — but NOT things like "10-50" or "$3,000"
  if (/^[+-]?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s; // bare string (e.g. `hello world`, `fitcheck`, `10-50 employees`)
}

// Strip an inline `# comment`, but only a `#` that is OUTSIDE quotes and preceded by
// whitespace (or at column 0). A `#` that opens a quoted string ("#FF6B35") is preserved.
function stripInlineComment(s) {
  let inS = false, inD = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if (c === '#' && !inS && !inD && (i === 0 || /\s/.test(s[i - 1]))) {
      return s.slice(0, i);
    }
  }
  return s;
}

// indent width = count of leading spaces (brand-config uses spaces only, never tabs).
function indentOf(line) {
  let n = 0;
  while (n < line.length && line[n] === ' ') n++;
  return n;
}

// Tokenize into structural lines, dropping blank + full-comment lines. Block scalars are
// NOT pre-tokenized here — they're consumed verbatim by the parser when it meets `key: |`.
function tokenize(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    out.push({ raw: lines[i], indent: indentOf(lines[i]), lineNo: i });
  }
  return out;
}

function isSkippable(raw) {
  const t = raw.trim();
  return t === '' || t.startsWith('#');
}

// Consume a `|` literal block: every subsequent line indented deeper than `parentIndent`
// belongs to the block. Interior blank lines are kept; the block is de-indented to its own
// least-indented content line, and trailing blank lines are trimmed (literal-block "clip").
// Advances cur.pos past the block.
function readBlockScalar(cur, parentIndent) {
  const { tokens } = cur;
  const body = [];
  while (cur.pos < tokens.length) {
    const { raw } = tokens[cur.pos];
    if (raw.trim() === '') { body.push(''); cur.pos++; continue; } // blank line — provisionally in block
    if (indentOf(raw) > parentIndent) { body.push(raw); cur.pos++; continue; }
    break; // a line at/under the parent indent ends the block
  }
  while (body.length && body[body.length - 1] === '') body.pop(); // clip trailing blanks
  const min = body.filter((l) => l !== '').reduce((m, l) => Math.min(m, indentOf(l)), Infinity);
  const dedent = Number.isFinite(min) ? min : 0;
  return body.map((l) => (l === '' ? '' : l.slice(dedent))).join('\n');
}

// Parse the block of sibling lines at exactly `indent`, advancing the shared `cur` cursor.
// Returns the JS value (object | array | null-if-empty). Recurses for deeper indents.
//
// Cursor invariant: cur.pos only ever moves FORWARD. Every branch either consumes the
// current line (cur.pos++) or recurses into a deeper block that consumes ≥1 line — so the
// loop can never spin in place. (The previous slice+reindex approach violated this; this
// in-place rewrite of a `- key:` line keeps a single coordinate system.)
function parseBlock(cur, indent) {
  const { tokens } = cur;
  // skip blank/comment lines to find the first real line of this block
  while (cur.pos < tokens.length && isSkippable(tokens[cur.pos].raw)) cur.pos++;
  if (cur.pos >= tokens.length || tokens[cur.pos].indent < indent) return null; // nothing at this depth

  const head = tokens[cur.pos].raw.slice(indent);
  const isSeq = head.startsWith('- ') || head.trim() === '-';
  const container = isSeq ? [] : {};

  while (cur.pos < tokens.length) {
    const tok = tokens[cur.pos];
    if (isSkippable(tok.raw)) { cur.pos++; continue; }
    if (tok.indent < indent) break;            // dedent → this block is done
    if (tok.indent > indent) { cur.pos++; continue; } // defensive: stray deeper line

    const content = stripInlineComment(tok.raw.slice(indent)).replace(/\s+$/, '');

    if (isSeq) {
      const rest = content.replace(/^-\s*/, '');
      if (rest === '') {
        // `-` alone → the item is the deeper block beneath it
        cur.pos++;
        container.push(parseBlock(cur, indent + 2));
      } else if (/^[^:\s][^:]*:(\s|$)/.test(rest)) {
        // `- key: value` → a MAP item. Rewrite THIS line in place to a plain map line at
        // indent+2 (no slicing, same cursor), then recurse: the map parse consumes this
        // line plus any continuation keys of the same item, advancing cur.pos correctly.
        const itemIndent = indent + 2;
        tokens[cur.pos] = { raw: ' '.repeat(itemIndent) + rest, indent: itemIndent, lineNo: tok.lineNo };
        container.push(parseBlock(cur, itemIndent));
      } else {
        container.push(coerceScalar(rest)); // `- scalar`
        cur.pos++;
      }
      continue;
    }

    // map entry: `key: value` | `key:` | `key: |` | `key: []`
    const m = content.match(/^([^:]+):(?:\s+(.*))?$/);
    if (!m) { cur.pos++; continue; } // unrecognized — skip defensively
    const key = m[1].trim();
    const inline = m[2] === undefined ? '' : m[2];

    if (inline === '|' || inline === '|-' || inline === '|+' || inline === '>') {
      cur.pos++;
      container[key] = readBlockScalar(cur, indent); // literal block (folded `>` treated as literal)
    } else if (inline === '[]') {
      container[key] = [];
      cur.pos++;
    } else if (inline === '{}') {
      container[key] = {};
      cur.pos++;
    } else if (inline === '') {
      // value is the indented block beneath this key (map or sequence)
      cur.pos++;
      const val = parseBlock(cur, indent + 2);
      container[key] = val === null ? {} : val;
    } else {
      container[key] = coerceScalar(inline);
      cur.pos++;
    }
  }

  return container;
}

export function parseYaml(text) {
  if (typeof text !== 'string') return {};
  const cur = { tokens: tokenize(text), pos: 0 };
  const val = parseBlock(cur, 0);
  return val === null ? {} : val;
}

// ---- CLI: `node taste/scripts/lib/yaml-lite.mjs <file.yaml>` → pretty JSON (handy for debugging) ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node taste/scripts/lib/yaml-lite.mjs <file.yaml>');
    process.exit(2);
  }
  console.log(JSON.stringify(parseYaml(readFileSync(target, 'utf8')), null, 2));
}
