import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { updateStage } from "./status";
import type { SocialItem } from "./types";

const VAULT_PATH = "/Volumes/madara/2026/twc-vault";
const HASH_FILE = `${VAULT_PATH}/.social-intake-hashes.json`;

function loadHashes(): Set<string> {
  if (existsSync(HASH_FILE)) {
    const data = JSON.parse(readFileSync(HASH_FILE, "utf-8"));
    return new Set(data);
  }
  return new Set();
}

function saveHashes(hashes: Set<string>): void {
  writeFileSync(HASH_FILE, JSON.stringify([...hashes], null, 2));
}

function hashItem(item: SocialItem): string {
  return createHash("sha256").update(`${item.source}:${item.id}`).digest("hex");
}

export function dedupeItems(items: SocialItem[]): { passed: SocialItem[]; skipped: number } {
  updateStage("dedupe", { status: "running", total: items.length });

  const hashes = loadHashes();
  const passed: SocialItem[] = [];
  let skipped = 0;

  for (const item of items) {
    const hash = hashItem(item);
    if (hashes.has(hash)) {
      skipped++;
    } else {
      hashes.add(hash);
      passed.push(item);
    }
  }

  saveHashes(hashes);
  updateStage("dedupe", { status: "completed", count: passed.length, skipped });
  console.log(`Dedupe: ${passed.length} new, ${skipped} skipped`);

  return { passed, skipped };
}
