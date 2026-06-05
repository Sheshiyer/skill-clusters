import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { PipelineStatus } from "./types";

const STATUS_DIR = join(process.env.HOME!, ".config", "harpoon");
const STATUS_FILE = join(STATUS_DIR, "pipeline.json");

let currentStatus: PipelineStatus = {
  lastRun: new Date().toISOString(),
  status: "idle",
  currentStage: "",
  stages: {
    fetch: { status: "pending" },
    normalize: { status: "pending" },
    dedupe: { status: "pending" },
    enrich: { status: "pending" },
    route: { status: "pending" },
    write: { status: "pending" },
  },
  recentItems: [],
};

export function initStatus(): void {
  mkdirSync(STATUS_DIR, { recursive: true });
  currentStatus.lastRun = new Date().toISOString();
  currentStatus.status = "running";
  writeStatus();
}

export function updateStage(
  stage: string,
  update: Partial<PipelineStatus["stages"][string]>
): void {
  currentStatus.currentStage = stage;
  currentStatus.stages[stage] = { ...currentStatus.stages[stage], ...update };
  writeStatus();
}

export function addRecentItem(item: { title: string; source: string; routed: string }): void {
  currentStatus.recentItems.unshift(item);
  if (currentStatus.recentItems.length > 20) currentStatus.recentItems.length = 20;
  writeStatus();
}

export function completeStatus(): void {
  currentStatus.status = "completed";
  writeStatus();
}

export function errorStatus(error: string): void {
  currentStatus.status = "error";
  currentStatus.error = error;
  writeStatus();
}

function sanitizeString(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += value[i] + value[i + 1];
        i++;
      } else {
        out += "\uFFFD";
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) {
      out += "\uFFFD";
      continue;
    }
    out += value[i];
  }
  return out;
}

function sanitizeForJson(value: unknown): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeForJson(v);
    return out;
  }
  return value;
}

function writeStatus(): void {
  const safe = sanitizeForJson(currentStatus);
  writeFileSync(STATUS_FILE, JSON.stringify(safe, null, 2));
}
