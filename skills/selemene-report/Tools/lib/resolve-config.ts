import fs from "node:fs";
import path from "node:path";

export interface SelemeneConfig {
  rustUrl: string;
  tsUrl: string;
  apiKey?: string;
  outputDir?: string;
}

function findConfig(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, ".selemenerc.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function resolveConfig(): SelemeneConfig {
  const configPath = findConfig();
  let fileConfig: Partial<SelemeneConfig> = {};
  if (configPath) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch {
      // ignore malformed config; fall back to env defaults
    }
  }
  return {
    rustUrl:
      process.env.SELEMENE_RUST_URL ??
      fileConfig.rustUrl ??
      "http://localhost:8080",
    tsUrl:
      process.env.SELEMENE_TS_URL ?? fileConfig.tsUrl ?? "http://localhost:3001",
    apiKey: process.env.SELEMENE_API_KEY ?? fileConfig.apiKey,
    outputDir: process.env.SELEMENE_OUTPUT_DIR ?? fileConfig.outputDir,
  };
}
