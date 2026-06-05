/**
 * Decay Scoring — flags notes with zero links after 30 days.
 * Scans Social-Inbox notes and marks stale ones for review.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { updateStage } from "./status";

const VAULT_PATH = "/Volumes/madara/2026/twc-vault";
const DECAY_THRESHOLD_DAYS = 30;

interface DecayResult {
  staleNotes: { path: string; age: number; hasLinks: boolean }[];
  totalScanned: number;
  flagged: number;
}

function scanDirForBacklinks(
  dir: string,
  targetNames: Set<string>,
  linkedTargets: Set<string>
): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && !entry.name.startsWith("_")) {
      scanDirForBacklinks(fullPath, targetNames, linkedTargets);
    } else if (entry.name.endsWith(".md")) {
      try {
        const content = readFileSync(fullPath, "utf-8");
        const matches = content.matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g);
        for (const match of matches) {
          const rawTarget = (match[1] || "").trim();
          if (!rawTarget) continue;
          const baseTarget = rawTarget.split("/").pop() || rawTarget;
          if (targetNames.has(baseTarget)) {
            linkedTargets.add(baseTarget);
          }
        }
      } catch {
        // skip unreadable files
      }
    }
  }
}

function buildBacklinkSet(targetNames: Set<string>): Set<string> {
  const linkedTargets = new Set<string>();
  const searchDirs = ["01-Projects", "02-Areas", "03-Resources"];
  for (const dir of searchDirs) {
    const dirPath = join(VAULT_PATH, dir);
    if (!existsSync(dirPath)) continue;
    try {
      scanDirForBacklinks(dirPath, targetNames, linkedTargets);
    } catch {
      // ignore scan errors
    }
  }
  return linkedTargets;
}

function getNoteDays(filePath: string): number {
  // Try to extract date from frontmatter first
  try {
    const content = readFileSync(filePath, "utf-8");
    const dateMatch = content.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
    if (dateMatch) {
      const noteDate = new Date(dateMatch[1]);
      const now = new Date();
      return Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } catch {
    // fallback to file stat
  }

  const stats = statSync(filePath);
  const now = new Date();
  return Math.floor((now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24));
}

export function runDecayScoring(): DecayResult {
  const inboxDir = join(VAULT_PATH, "03-Resources", "Social-Inbox");
  if (!existsSync(inboxDir)) {
    return { staleNotes: [], totalScanned: 0, flagged: 0 };
  }

  const files = readdirSync(inboxDir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  const noteBaseNames = new Set(files.map((f) => f.replace(/\.md$/, "")));
  const linkedTargets = buildBacklinkSet(noteBaseNames);
  updateStage("decay", { status: "running", total: files.length, done: 0 });

  const staleNotes: DecayResult["staleNotes"] = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = join(inboxDir, files[i]);
    const age = getNoteDays(filePath);

    if (age >= DECAY_THRESHOLD_DAYS) {
      const baseName = files[i].replace(/\.md$/, "");
      const hasLinks = linkedTargets.has(baseName);

      if (!hasLinks) {
        staleNotes.push({ path: filePath, age, hasLinks });

        // Add decay frontmatter tag if not present
        try {
          const content = readFileSync(filePath, "utf-8");
          if (!content.includes("decay_flagged:")) {
            const updated = content.replace(
              /^---\n/m,
              `---\ndecay_flagged: ${new Date().toISOString().split("T")[0]}\n`
            );
            writeFileSync(filePath, updated);
          }
        } catch {
          // non-critical
        }
      }
    }

    updateStage("decay", { status: "running", total: files.length, done: i + 1 });
  }

  updateStage("decay", { status: "completed", count: staleNotes.length });
  console.log(`Decay: ${staleNotes.length} stale notes flagged out of ${files.length} scanned`);

  return { staleNotes, totalScanned: files.length, flagged: staleNotes.length };
}
