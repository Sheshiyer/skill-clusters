import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { generateDeterministicImpl } from "./Report.ts";

describe("generateDeterministicImpl", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "selemene-report-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes a markdown artifact from a mocked backend response", async () => {
    const fakeFetcher = async () =>
      new Response(
        JSON.stringify({
          title: "Birth Chart Report for Ada",
          subject_name: "Ada",
          summary: "Summary text.",
          sections: [{ title: "Info", content: "Details", key_points: ["A"] }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const { artifactPath } = await generateDeterministicImpl(
      "birth",
      tmpDir,
      { name: "Ada", datetime: "1990-01-15T10:30:00+05:30", location: "Bangalore", format: "text" },
      { rustUrl: "http://localhost:8080" },
      fakeFetcher as any
    );

    expect(fs.existsSync(artifactPath)).toBe(true);
    const content = fs.readFileSync(artifactPath, "utf-8");
    expect(content).toContain("# Birth Chart Report for Ada");
    expect(content).toContain("Summary text.");
    expect(artifactPath.endsWith(".md")).toBe(true);
  });

  it("throws when backend returns non-ok", async () => {
    const fakeFetcher = async () =>
      new Response("Internal Server Error", { status: 500 });

    let threw = false;
    try {
      await generateDeterministicImpl(
        "birth",
        tmpDir,
        { name: "Ada" },
        { rustUrl: "http://localhost:8080" },
        fakeFetcher as any
      );
    } catch (e) {
      threw = true;
      expect((e as Error).message).toContain("Report backend returned 500");
    }
    expect(threw).toBe(true);
  });
});
