import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { generateDeterministicImpl, generateWitnessImpl } from "./Report.ts";

describe("Report.ts", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "selemene-report-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("generateDeterministicImpl", () => {
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

  describe("generateWitnessImpl", () => {
    let subjectsPath: string;

    beforeEach(() => {
      subjectsPath = path.join(tmpDir, "subjects.json");
      fs.writeFileSync(
        subjectsPath,
        JSON.stringify([
          {
            role: "primary",
            name: "Ada",
            birth_date: "1990-01-15",
            birth_time: "10:30",
            birth_time_confidence: "exact",
            birth_location_query: "Bangalore",
          },
        ]),
        "utf-8"
      );
    });

    it("writes witness markdown from mocked pipeline response", async () => {
      const fakeFetcher = async () =>
        new Response(
          JSON.stringify({ assembled: "## Witness Reading\n\nThis is the reading." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );

      const { artifactPath } = await generateWitnessImpl(
        "solo",
        subjectsPath,
        "L3",
        tmpDir,
        { tsUrl: "http://localhost:3001" },
        fakeFetcher as any
      );

      expect(fs.existsSync(artifactPath)).toBe(true);
      const content = fs.readFileSync(artifactPath, "utf-8");
      expect(content).toContain("## Witness Reading");
      expect(artifactPath.endsWith(".md")).toBe(true);
    });

    it("throws when witness pipeline returns non-ok", async () => {
      const fakeFetcher = async () =>
        new Response("Pipeline Error", { status: 503 });

      let threw = false;
      try {
        await generateWitnessImpl(
          "solo",
          subjectsPath,
          "L3",
          tmpDir,
          { tsUrl: "http://localhost:3001" },
          fakeFetcher as any
        );
      } catch (e) {
        threw = true;
        expect((e as Error).message).toContain("Witness pipeline returned 503");
      }
      expect(threw).toBe(true);
    });
  });
});
