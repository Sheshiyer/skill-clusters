/**
 * Harpoon Bi-directional Actions — enables reclassify and reject
 * from the Harpoon Pro applet back into the pipeline.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, renameSync, mkdirSync } from "fs";
import { join, basename } from "path";
import { updateStage } from "./status";

const VAULT_PATH = "/Volumes/madara/2026/twc-vault";
const HARPOON_DIR = join(process.env.HOME!, ".config", "harpoon");
const ACTIONS_FILE = join(HARPOON_DIR, "actions.json");
const FALLBACK_FOLDER = "03-Resources/Social-Inbox";

export interface HarpoonAction {
  type: "reclassify" | "reject" | "retag";
  filePath: string;
  newFolder?: string; // for reclassify
  newTags?: string[]; // for retag
  timestamp: string;
}

interface ActionsQueue {
  pending: HarpoonAction[];
  processed: HarpoonAction[];
}

function isHarpoonAction(value: unknown): value is HarpoonAction {
  if (!value || typeof value !== "object") return false;
  const action = value as Record<string, unknown>;
  if (action.type !== "reclassify" && action.type !== "reject" && action.type !== "retag") return false;
  if (typeof action.filePath !== "string" || action.filePath.length === 0) return false;
  if (typeof action.timestamp !== "string" || action.timestamp.length === 0) return false;
  if (action.newFolder !== undefined && typeof action.newFolder !== "string") return false;
  if (
    action.newTags !== undefined &&
    (!Array.isArray(action.newTags) || action.newTags.some((tag) => typeof tag !== "string"))
  )
    return false;
  return true;
}

function normalizeQueue(value: unknown): ActionsQueue {
  if (Array.isArray(value)) {
    return { pending: value.filter(isHarpoonAction), processed: [] };
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const pending = Array.isArray(obj.pending) ? obj.pending.filter(isHarpoonAction) : [];
    const processed = Array.isArray(obj.processed) ? obj.processed.filter(isHarpoonAction) : [];
    return { pending, processed };
  }

  return { pending: [], processed: [] };
}

function loadActions(): ActionsQueue {
  if (existsSync(ACTIONS_FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(ACTIONS_FILE, "utf-8"));
      return normalizeQueue(parsed);
    } catch {
      return { pending: [], processed: [] };
    }
  }
  return { pending: [], processed: [] };
}

function saveActions(queue: ActionsQueue): void {
  mkdirSync(HARPOON_DIR, { recursive: true });
  writeFileSync(ACTIONS_FILE, JSON.stringify(queue, null, 2));
}

function reclassifyNote(action: HarpoonAction): boolean {
  if (!action.newFolder || !existsSync(action.filePath)) return false;

  const targetDir = join(VAULT_PATH, action.newFolder);
  mkdirSync(targetDir, { recursive: true });

  const filename = basename(action.filePath);
  const targetPath = join(targetDir, filename);

  // Read file, update frontmatter para_location
  const content = readFileSync(action.filePath, "utf-8");
  const updated = content.replace(
    /^para_location: .+$/m,
    `para_location: ${action.newFolder}`
  );

  writeFileSync(targetPath, updated);
  unlinkSync(action.filePath);
  return true;
}

function rejectNote(action: HarpoonAction): boolean {
  if (!existsSync(action.filePath)) return false;

  const rejectDir = join(VAULT_PATH, "03-Resources", "Social-Inbox", "_rejected");
  mkdirSync(rejectDir, { recursive: true });

  const filename = basename(action.filePath);
  renameSync(action.filePath, join(rejectDir, filename));
  return true;
}

function retagNote(action: HarpoonAction): boolean {
  if (!action.newTags || !existsSync(action.filePath)) return false;

  const content = readFileSync(action.filePath, "utf-8");
  const updated = content.replace(
    /^tags: \[.*\]$/m,
    `tags: [${action.newTags.join(", ")}]`
  );

  writeFileSync(action.filePath, updated);
  return true;
}

export function processHarpoonActions(): { processed: number; errors: number } {
  const queue = loadActions();
  console.log("Debug: Harpoon Actions Queue:", JSON.stringify(queue));
  if (!queue || !queue.pending) {
    console.error("Error: Harpoon queue or queue.pending is undefined!");
    return { processed: 0, errors: 0 };
  }
  if (queue.pending.length === 0) return { processed: 0, errors: 0 };

  updateStage("harpoon-actions", { status: "running", total: queue.pending.length, done: 0 });

  let processed = 0;
  let errors = 0;
  const remaining: HarpoonAction[] = [];

  for (let i = 0; i < queue.pending.length; i++) {
    const action = queue.pending[i];
    let success = false;

    try {
      switch (action.type) {
        case "reclassify":
          success = reclassifyNote(action);
          break;
        case "reject":
          success = rejectNote(action);
          break;
        case "retag":
          success = retagNote(action);
          break;
      }
    } catch {
      success = false;
    }

    if (success) {
      queue.processed.push({ ...action, timestamp: new Date().toISOString() });
      processed++;
    } else {
      errors++;
      remaining.push(action);
    }

    updateStage("harpoon-actions", { status: "running", total: queue.pending.length, done: i + 1 });
  }

  queue.pending = remaining;
  // Keep only last 100 processed actions
  if (queue.processed.length > 100) queue.processed = queue.processed.slice(-100);
  saveActions(queue);

  updateStage("harpoon-actions", { status: "completed", count: processed });
  console.log(`Harpoon actions: ${processed} processed, ${errors} errors`);
  return { processed, errors };
}

/** Initialize empty actions file for Harpoon to write to */
export function ensureActionsFile(): void {
  if (!existsSync(ACTIONS_FILE)) {
    saveActions({ pending: [], processed: [] });
  }
}
