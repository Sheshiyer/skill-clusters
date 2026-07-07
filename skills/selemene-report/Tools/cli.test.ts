import { describe, it, expect } from "bun:test";
import { parseReportArgs } from "./Report.ts";

describe("parseReportArgs", () => {
  it("parses a birth command", () => {
    const parsed = parseReportArgs([
      "birth",
      "Ada",
      "1990-01-15T10:30:00+05:30",
      "Bangalore",
      "--output-dir",
      "/tmp/reports",
      "--format",
      "json",
    ]);
    expect(parsed.type).toBe("birth");
    expect(parsed.positionals[1]).toBe("Ada");
    expect(parsed.outputDir).toBe("/tmp/reports");
    expect(parsed.values.format).toBe("json");
  });

  it("parses a witness command", () => {
    const parsed = parseReportArgs([
      "witness",
      "--mode",
      "solo",
      "--subjects",
      "subjects.json",
      "--level",
      "L4",
    ]);
    expect(parsed.type).toBe("witness");
    expect(parsed.values.mode).toBe("solo");
    expect(parsed.values.subjects).toBe("subjects.json");
    expect(parsed.values.level).toBe("L4");
  });

  it("throws on unknown report type", () => {
    expect(() => parseReportArgs(["unknown"])).toThrow("Unknown report type");
  });

  it("parses --dry-run without invoking backend", () => {
    const parsed = parseReportArgs([
      "birth",
      "Ada",
      "1990-01-15T10:30:00+05:30",
      "Bangalore",
      "--dry-run",
    ]);
    expect(parsed.values["dry-run"]).toBe(true);
  });
});
