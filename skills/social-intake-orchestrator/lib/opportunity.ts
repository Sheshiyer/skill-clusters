/**
 * Bookmark Opportunity Scanner — leverages x-bookmark-opportunity-skill
 * to produce effort-bucketed opportunities with lane recommendations.
 */
import { execSync } from "child_process";
import { updateStage } from "./status";
import type { EnrichedItem } from "./types";

const INFERENCE_PATH = "/Users/sheshnarayaniyer/.claude/skills/PAI/Tools/Inference.ts";

export interface Opportunity {
  itemId: string;
  effort: "20m" | "60m" | "2-4h" | "parked";
  nextSteps: string[];
  lane: string;
  domain: string;
  score: number;
}

function classifyDomain(text: string): { domain: string; score: number } {
  const lower = text.toLowerCase();
  const domains: [string, string[], number][] = [
    ["Technology/Engineering", ["code", "api", "dev", "software", "typescript", "react", "rust", "deploy", "infra", "docker", "kubernetes", "ci/cd", "git"], 5],
    ["Health/Wellness", ["health", "fitness", "workout", "nutrition", "sleep", "meditation", "wellness", "exercise"], 3],
    ["Critical-Thinking/Power-Analysis", ["power", "politics", "critical", "analysis", "geopolitics", "strategy", "influence", "systems"], 8],
    ["Occult/Esoteric-Knowledge", ["occult", "esoteric", "astrology", "tarot", "mysticism", "alchemy", "consciousness"], 4],
    ["Consciousness/Altered-States", ["psychedelic", "meditation", "awareness", "mindfulness", "altered", "states", "dmt", "flow"], 9],
  ];

  let best = { domain: "Knowledge/Research", score: 5 };
  let bestCount = 0;

  for (const [domain, keywords, enneagramType] of domains) {
    const count = keywords.filter((k) => lower.includes(k)).length;
    if (count > bestCount) {
      bestCount = count;
      best = { domain, score: enneagramType };
    }
  }

  return best;
}

function estimateEffort(text: string): "20m" | "60m" | "2-4h" | "parked" {
  const len = text.length;
  const hasUrl = /https?:\/\//.test(text);
  const hasThread = text.includes("🧵") || text.includes("thread");

  if (len < 200 && !hasUrl) return "20m";
  if (len < 500 || (hasUrl && !hasThread)) return "60m";
  if (hasThread || len > 800) return "2-4h";
  return "60m";
}

export function scanOpportunities(items: EnrichedItem[]): Map<string, Opportunity> {
  updateStage("opportunity", { status: "running", total: items.length, done: 0 });

  const opportunities = new Map<string, Opportunity>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const { domain, score } = classifyDomain(item.text);
      const effort = estimateEffort(item.text);

      // Generate next steps via AI inference
      let nextSteps: string[] = [];
      try {
        const prompt = `Given this bookmarked content, suggest 1-3 concrete next action steps (each under 15 words). Return ONLY a JSON array of strings.

CONTENT: ${item.text.slice(0, 400)}
DOMAIN: ${domain}
EFFORT: ${effort}`;

        const result = execSync(
          `echo ${JSON.stringify(prompt)} | bun "${INFERENCE_PATH}" fast`,
          { timeout: 15_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
        );

        const arrMatch = result.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          const parsed = JSON.parse(arrMatch[0]);
          if (Array.isArray(parsed)) nextSteps = parsed.slice(0, 3);
        }
      } catch {
        nextSteps = [`Review ${domain.toLowerCase()} content and extract key insights`];
      }

      const lane = domain === "Technology/Engineering"
        ? "vishwakarma-build"
        : domain === "Health/Wellness"
        ? "chitta-track"
        : "akashic-learn";

      opportunities.set(item.id, {
        itemId: item.id,
        effort,
        nextSteps,
        lane,
        domain,
        score,
      });
    } catch {
      // Non-critical — skip
    }

    updateStage("opportunity", { status: "running", total: items.length, done: i + 1 });
  }

  updateStage("opportunity", { status: "completed", count: opportunities.size });
  console.log(`Opportunities: ${opportunities.size} items scanned`);
  return opportunities;
}

/** Format opportunity as markdown for vault notes */
export function formatOpportunity(opp: Opportunity): string {
  const steps = opp.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return `\n## Opportunity\n\n**Domain:** ${opp.domain} | **Effort:** ${opp.effort} | **Lane:** ${opp.lane}\n\n### Next Steps\n${steps}\n`;
}
