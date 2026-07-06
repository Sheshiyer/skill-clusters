import { describe, it, expect } from "bun:test";
import { renderMarkdownReport } from "./reports.ts";

describe("renderMarkdownReport", () => {
  it("renders a birth report from GeneratedReport JSON", () => {
    const report = {
      title: "Birth Chart Report for Ada",
      subject_name: "Ada",
      summary: "A short summary.",
      sections: [
        {
          title: "Personal Information",
          content: "Name: Ada...",
          key_points: ["Point A", "Point B"],
        },
      ],
    };

    const md = renderMarkdownReport(report, "birth");
    expect(md).toContain("# Birth Chart Report for Ada");
    expect(md).toContain("A short summary.");
    expect(md).toContain("## Personal Information");
    expect(md).toContain("- Point A");
    expect(md).toContain("- Point B");
  });

  it("falls back to generic title when report.title is missing", () => {
    const md = renderMarkdownReport({ summary: "Only summary" }, "birth");
    expect(md).toContain("# birth report");
  });
});
