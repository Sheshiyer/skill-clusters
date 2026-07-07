import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { writeManifest } from "./write-manifest.ts";

describe("writeManifest", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "selemene-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes manifest.json with the correct shape", async () => {
    const artifactPath = path.join(tmpDir, "birth-name-20260706-134500.md");
    fs.writeFileSync(artifactPath, "# Report", "utf-8");

    const manifestPath = await writeManifest({
      reportType: "birth",
      outputDir: tmpDir,
      artifactPath,
      subjectCount: 1,
      enginesUsed: ["vedic"],
      prompt: "What do you notice?",
    });

    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.report_type).toBe("birth");
    expect(manifest.subject_count).toBe(1);
    expect(manifest.artifact_path).toBe(path.resolve(artifactPath));
    expect(manifest.engines_used).toEqual(["vedic"]);
    expect(manifest.witness_prompt).toBe("What do you notice?");
    expect(typeof manifest.created_at).toBe("string");
  });

  it("uses default engines when none provided", async () => {
    const artifactPath = path.join(tmpDir, "witness-solo-20260706-134500.md");
    fs.writeFileSync(artifactPath, "# Reading", "utf-8");

    await writeManifest({
      reportType: "witness",
      outputDir: tmpDir,
      artifactPath,
      subjectCount: 1,
      prompt: "What is alive?",
    });

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, "manifest.json"), "utf-8"));
    expect(manifest.engines_used).toEqual(["vedic"]);
  });
});
