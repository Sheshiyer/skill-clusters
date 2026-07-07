import fs from "node:fs";
import path from "node:path";

export interface ManifestInput {
  reportType: string;
  outputDir: string;
  artifactPath: string;
  subjectCount: number | string;
  enginesUsed?: string[];
  prompt: string;
}

export async function writeManifest(input: ManifestInput): Promise<string> {
  const manifest = {
    report_type: input.reportType,
    created_at: new Date().toISOString(),
    subject_count: input.subjectCount,
    engines_used: input.enginesUsed ?? ["vedic"],
    artifact_path: path.resolve(input.artifactPath),
    witness_prompt: input.prompt,
  };
  const manifestPath = path.join(input.outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  return manifestPath;
}
