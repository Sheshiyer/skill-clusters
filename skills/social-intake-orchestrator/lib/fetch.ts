import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { updateStage } from "./status";
import type { CursorStore } from "./types";

const CURSOR_DIR = join(process.env.HOME!, ".config", "harpoon");
const CURSOR_FILE = join(CURSOR_DIR, "cursors.json");
const BIRD_CONFIG_FILE = join(process.env.HOME!, ".config", "bird", "config.json5");

function loadCursors(): CursorStore {
  if (existsSync(CURSOR_FILE)) {
    return JSON.parse(readFileSync(CURSOR_FILE, "utf-8"));
  }
  return {};
}

function saveCursors(cursors: CursorStore): void {
  mkdirSync(CURSOR_DIR, { recursive: true });
  writeFileSync(CURSOR_FILE, JSON.stringify(cursors, null, 2));
}

const FETCH_LIMIT = parseInt(process.env.FETCH_LIMIT || "50", 10);

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function extractTokenFromConfig(raw: string, key: string): string | null {
  const pattern = new RegExp(`["']${key}["']\\s*:\\s*["']([^"']+)["']`);
  const match = raw.match(pattern);
  return match?.[1] || null;
}

function loadBirdCredentials(): { authToken: string | null; ct0: string | null } {
  const envAuth = process.env.AUTH_TOKEN || null;
  const envCt0 = process.env.CT0 || null;
  if (envAuth && envCt0) {
    return { authToken: envAuth, ct0: envCt0 };
  }

  if (!existsSync(BIRD_CONFIG_FILE)) {
    return { authToken: envAuth, ct0: envCt0 };
  }

  try {
    const raw = readFileSync(BIRD_CONFIG_FILE, "utf-8");
    const configAuth =
      extractTokenFromConfig(raw, "auth_token") || extractTokenFromConfig(raw, "authToken");
    const configCt0 = extractTokenFromConfig(raw, "ct0");
    return {
      authToken: envAuth || configAuth,
      ct0: envCt0 || configCt0,
    };
  } catch {
    return { authToken: envAuth, ct0: envCt0 };
  }
}

export interface FetchResult {
  twitter: unknown[];
  instagram: { json: Record<string, unknown>; filename: string }[];
  errors: string[];
}

export function fetchAll(): FetchResult {
  updateStage("fetch", { status: "running" });

  const result: FetchResult = { twitter: [], instagram: [], errors: [] };

  // --- Twitter via bird-cli ---
  try {
    const creds = loadBirdCredentials();
    const credFlags =
      creds.authToken && creds.ct0
        ? ` --auth-token ${shellEscape(creds.authToken)} --ct0 ${shellEscape(creds.ct0)}`
        : "";
    const cmd = `bird bookmarks --json -n ${FETCH_LIMIT}${credFlags}`;
    const stdout = execSync(cmd, { timeout: 60_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    // bird outputs warnings to stderr, JSON to stdout — parse only valid JSON
    const jsonStart = stdout.indexOf("[");
    if (jsonStart !== -1) {
      result.twitter = JSON.parse(stdout.slice(jsonStart));
    }
  } catch (err: any) {
    result.errors.push(`Twitter fetch failed: ${err.message}`);
  }

  // --- Instagram via gram saved ---
  try {
    const tmpDir = join(process.env.TMPDIR || "/tmp", `gram-saved-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    const cmd = `gram saved --output "${tmpDir}" --limit ${FETCH_LIMIT}`;
    execSync(cmd, { timeout: 120_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });

    // gram writes {date}_{shortcode}.json files
    const savedDir = join(tmpDir, "saved");
    if (existsSync(savedDir)) {
      const jsonFiles = readdirSync(savedDir).filter((f) => f.endsWith(".json"));
      for (const file of jsonFiles) {
        try {
          const content = JSON.parse(readFileSync(join(savedDir, file), "utf-8"));
          result.instagram.push({ json: content, filename: file });
        } catch {
          // skip malformed JSON
        }
      }
    }
  } catch (err: any) {
    result.errors.push(`Instagram fetch failed: ${err.message}`);
  }

  const totalCount = result.twitter.length + result.instagram.length;
  updateStage("fetch", { status: "completed", count: totalCount });

  console.log(`Fetched: ${result.twitter.length} Twitter, ${result.instagram.length} Instagram`);
  if (result.errors.length) console.log(`Fetch errors: ${result.errors.join("; ")}`);

  return result;
}
