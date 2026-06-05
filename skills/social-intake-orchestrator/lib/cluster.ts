/**
 * Content Clustering + MOC Auto-Generation
 * Groups related bookmarks by tags/domain and generates MOC files.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { updateStage } from "./status";
import type { EnrichedItem } from "./types";

const VAULT_PATH = "/Volumes/madara/2026/twc-vault";
const MOC_DIR = join(VAULT_PATH, "03-Resources", "Social-Inbox", "_mocs");
const INFERENCE_PATH = "/Users/sheshnarayaniyer/.claude/skills/PAI/Tools/Inference.ts";

interface Cluster {
  name: string;
  slug: string;
  items: { title: string; path: string; tags: string[]; date: string }[];
}

function extractTagsFromFrontmatter(content: string): string[] {
  const match = content.match(/^tags:\s*\[([^\]]*)\]/m);
  if (!match) return [];
  return match[1].split(",").map((t) => t.trim()).filter(Boolean);
}

function buildTagIndex(items: EnrichedItem[]): Map<string, EnrichedItem[]> {
  const index = new Map<string, EnrichedItem[]>();

  for (const item of items) {
    for (const tag of item.tags) {
      const list = index.get(tag) || [];
      list.push(item);
      index.set(tag, list);
    }
  }

  return index;
}

function generateClusterName(tag: string, items: EnrichedItem[]): string {
  // Title-case the tag
  return tag
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function clusterAndGenerateMOCs(
  items: EnrichedItem[],
  minClusterSize = 3
): { clusters: Cluster[]; mocsWritten: string[] } {
  if (items.length < minClusterSize) {
    return { clusters: [], mocsWritten: [] };
  }

  updateStage("cluster", { status: "running", total: items.length });

  const tagIndex = buildTagIndex(items);
  const clusters: Cluster[] = [];

  // Find tags with enough items to form a cluster
  for (const [tag, tagItems] of tagIndex) {
    if (tagItems.length >= minClusterSize) {
      const name = generateClusterName(tag, tagItems);
      clusters.push({
        name,
        slug: tag,
        items: tagItems.map((i) => ({
          title: i.text.slice(0, 80).replace(/\n/g, " "),
          path: `${i.paraFolder}/${i.date.split("T")[0]}-${i.source}-${i.author.handle}`,
          tags: i.tags,
          date: i.date.split("T")[0],
        })),
      });
    }
  }

  // Generate MOC files
  mkdirSync(MOC_DIR, { recursive: true });
  const mocsWritten: string[] = [];

  for (const cluster of clusters) {
    const mocPath = join(MOC_DIR, `MOC-${cluster.slug}.md`);
    const dateStr = new Date().toISOString().split("T")[0];

    const links = cluster.items
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((i) => `- [[${i.path}|${i.title.slice(0, 60)}]] (${i.date})`)
      .join("\n");

    // Generate a brief synthesis if we have enough items
    let synthesis = "";
    if (cluster.items.length >= 3) {
      try {
        const texts = cluster.items.slice(0, 5).map((i) => i.title).join("\n- ");
        const prompt = `Synthesize the common theme across these bookmarked items in 2-3 sentences. Be specific, not generic.\n\nItems:\n- ${texts}`;
        const result = execSync(
          `echo ${JSON.stringify(prompt)} | bun "${INFERENCE_PATH}" fast`,
          { timeout: 15_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
        );
        synthesis = result.trim().replace(/^["']|["']$/g, "");
      } catch {
        synthesis = `Collection of ${cluster.items.length} bookmarks related to ${cluster.name.toLowerCase()}.`;
      }
    }

    const content = `---
type: moc
topic: "${cluster.name}"
tag: ${cluster.slug}
item_count: ${cluster.items.length}
generated: ${dateStr}
---

# ${cluster.name}

${synthesis}

## Bookmarks (${cluster.items.length})

${links}
`;

    // Only write if new or if item count increased
    if (existsSync(mocPath)) {
      const existing = readFileSync(mocPath, "utf-8");
      const existingCount = existing.match(/item_count: (\d+)/)?.[1];
      if (existingCount && parseInt(existingCount) >= cluster.items.length) {
        continue; // MOC already up to date
      }
    }

    writeFileSync(mocPath, content);
    mocsWritten.push(mocPath);
  }

  updateStage("cluster", { status: "completed", count: clusters.length });
  console.log(`Clusters: ${clusters.length} found, ${mocsWritten.length} MOCs written`);
  return { clusters, mocsWritten };
}
