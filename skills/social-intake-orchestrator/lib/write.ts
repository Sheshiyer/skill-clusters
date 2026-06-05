import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { updateStage, addRecentItem } from "./status";
import type { EnrichedItem } from "./types";
import type { ThreadContext } from "./thread-expand";
import type { Opportunity } from "./opportunity";
import type { TranscriptResult } from "./transcript";
import { formatThread } from "./thread-expand";
import { formatOpportunity } from "./opportunity";
import { formatTranscript } from "./transcript";

export interface WriteEnrichments {
  threads?: Map<string, ThreadContext>;
  opportunities?: Map<string, Opportunity>;
  transcripts?: Map<string, TranscriptResult>;
}

const VAULT_PATH = "/Volumes/madara/2026/twc-vault";
const FALLBACK_FOLDER = "03-Resources/Social-Inbox";

function truncateByCodePoints(text: string, maxLen: number): string {
  return Array.from(text).slice(0, maxLen).join("");
}

function slugify(text: string, maxLen = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, maxLen)
    .replace(/-$/, "");
}

function resolveFolder(paraFolder: string): string {
  const fullPath = join(VAULT_PATH, paraFolder);
  if (existsSync(fullPath)) return paraFolder;
  // Fallback
  const fallbackPath = join(VAULT_PATH, FALLBACK_FOLDER);
  mkdirSync(fallbackPath, { recursive: true });
  return FALLBACK_FOLDER;
}

function generateMarkdown(item: EnrichedItem, enrichments?: WriteEnrichments): string {
  const hash = createHash("sha256").update(`${item.source}:${item.id}`).digest("hex");
  const mediaSection = item.media.length
    ? item.media.map((m) => (m.type === "video" ? `- [Video](${m.url})` : `![](${m.url})`)).join("\n")
    : "";

  const threadSection = item.thread
    ? `**Thread:** ${item.thread.position}/${item.thread.total} — [View full thread](${item.url})`
    : "";

  const engagementSection = item.engagement
    ? `**Engagement:** ${item.engagement.likes.toLocaleString()} likes | ${item.engagement.shares.toLocaleString()} shares`
    : "";

  // New enrichment sections
  const threadCtx = enrichments?.threads?.get(item.id);
  const fullThreadSection = threadCtx ? formatThread(threadCtx) : "";

  const opportunity = enrichments?.opportunities?.get(item.id);
  const opportunitySection = opportunity ? formatOpportunity(opportunity) : "";

  const transcript = enrichments?.transcripts?.get(item.id);
  const transcriptSection = transcript ? formatTranscript(transcript) : "";

  return `---
source: ${item.source}
author: "@${item.author.handle}"
author_name: "${item.author.name}"
date: ${item.date.split("T")[0]}
url: ${item.url}
tags: [${item.tags.join(", ")}]
enneagram_type: ${item.enneagramType}
para_location: ${item.paraFolder}
ingested: ${new Date().toISOString()}
hash: ${hash}
---

# ${truncateByCodePoints(item.text, 80).replace(/\n/g, " ")}

> ${item.text.replace(/\n/g, "\n> ")}

${threadSection}
${mediaSection ? `\n## Media\n${mediaSection}` : ""}
${engagementSection}

## Summary

${item.summary}

## Connections

- Enneagram: [[Enneagram-Type-${item.enneagramType}]]
${fullThreadSection}${opportunitySection}${transcriptSection}`.trim() + "\n";
}

export function writeItems(items: EnrichedItem[], enrichments?: WriteEnrichments): { written: string[]; errors: string[] } {
  updateStage("write", { status: "running", total: items.length, done: 0 });

  const written: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const folder = resolveFolder(item.paraFolder);
      const dateStr = item.date.split("T")[0];
      const slug = slugify(item.text) || item.id;
      const filename = `${dateStr}-${item.source}-${item.author.handle}-${slug}.md`;
      const filepath = join(VAULT_PATH, folder, filename);

      // Don't overwrite existing files
      if (existsSync(filepath)) {
        console.log(`Skip existing: ${filepath}`);
        continue;
      }

      const content = generateMarkdown(item, enrichments);
      mkdirSync(join(VAULT_PATH, folder), { recursive: true });
      writeFileSync(filepath, content);
      written.push(filepath);

      addRecentItem({
        title: truncateByCodePoints(item.text, 60),
        source: item.source,
        routed: folder,
      });
    } catch (err: any) {
      errors.push(`${item.source}/${item.id}: ${err.message}`);
    }

    updateStage("write", { status: "running", total: items.length, done: i + 1 });
  }

  updateStage("write", { status: "completed", count: written.length });
  console.log(`Written: ${written.length} files`);
  if (errors.length) console.log(`Write errors: ${errors.join("; ")}`);

  return { written, errors };
}
