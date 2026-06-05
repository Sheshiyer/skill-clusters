import { execSync } from "child_process";
import { readdirSync } from "fs";
import { updateStage } from "./status";
import type { SocialItem, EnrichedItem } from "./types";

const VAULT_PATH = "/Volumes/madara/2026/twc-vault";
const INFERENCE_PATH = "/Users/sheshnarayaniyer/.claude/skills/PAI/Tools/Inference.ts";

// Build taxonomy from existing vault folders
function getVaultFolders(): string[] {
  const folders: string[] = [];
  for (const prefix of ["02-Areas", "03-Resources"]) {
    try {
      const entries = readdirSync(`${VAULT_PATH}/${prefix}`, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          folders.push(`${prefix}/${entry.name}`);
        }
      }
    } catch {
      // ignore missing dirs
    }
  }
  return folders;
}

function buildEnrichmentPrompt(item: SocialItem, folders: string[]): string {
  const folderList = folders.slice(0, 40).join(", "); // limit to keep prompt short
  return `Analyze this social media bookmark and return ONLY valid JSON (no markdown, no explanation):

SOURCE: ${item.source}
AUTHOR: @${item.author.handle} (${item.author.name})
TEXT: ${item.text.slice(0, 500)}
URL: ${item.url}

Return this exact JSON structure:
{
  "summary": "2-3 sentence summary of the content and why it's worth saving",
  "tags": ["tag1", "tag2", "tag3"],
  "enneagramType": <number 1-9 indicating which Enneagram type this content most resonates with>,
  "paraFolder": "<best matching folder from: ${folderList}>"
}

Rules:
- tags: 3-5 lowercase kebab-case tags matching existing vault taxonomy
- enneagramType: 1=Perfectionist, 2=Helper, 3=Achiever, 4=Individualist, 5=Investigator, 6=Loyalist, 7=Enthusiast, 8=Challenger, 9=Peacemaker
- paraFolder: pick the BEST match from the folder list above. Default to "03-Resources/Social-Inbox" if nothing fits.`;
}

export async function enrichItems(items: SocialItem[]): Promise<EnrichedItem[]> {
  updateStage("enrich", { status: "running", total: items.length, done: 0 });

  const folders = getVaultFolders();
  const enriched: EnrichedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const prompt = buildEnrichmentPrompt(item, folders);
      const result = execSync(
        `echo ${JSON.stringify(prompt)} | bun "${INFERENCE_PATH}" fast`,
        { timeout: 30_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );

      // Extract JSON from response (might have markdown wrapping)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        enriched.push({
          ...item,
          summary: parsed.summary || "No summary generated",
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
          enneagramType: typeof parsed.enneagramType === "number" ? parsed.enneagramType : 5,
          paraFolder: parsed.paraFolder || "03-Resources/Social-Inbox",
        });
      } else {
        // Fallback: use item without enrichment
        enriched.push({
          ...item,
          summary: "AI enrichment failed — manual review needed",
          tags: [],
          enneagramType: 5,
          paraFolder: "03-Resources/Social-Inbox",
        });
      }
    } catch {
      // Graceful fallback
      enriched.push({
        ...item,
        summary: "AI enrichment failed — manual review needed",
        tags: [],
        enneagramType: 5,
        paraFolder: "03-Resources/Social-Inbox",
      });
    }

    updateStage("enrich", { status: "running", total: items.length, done: i + 1 });
  }

  updateStage("enrich", { status: "completed", count: enriched.length });
  console.log(`Enriched: ${enriched.length} items`);
  return enriched;
}
