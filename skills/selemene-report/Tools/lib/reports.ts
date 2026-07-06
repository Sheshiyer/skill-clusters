export interface GeneratedReport {
  title?: string;
  subject_name?: string;
  summary?: string;
  sections?: Array<{
    title: string;
    content: string;
    key_points?: string[];
  }>;
}

export function renderMarkdownReport(report: GeneratedReport, type: string): string {
  const sections = Array.isArray(report.sections)
    ? report.sections
        .map(
          (s) =>
            `## ${s.title}\n\n${s.content}${
              s.key_points?.length ? "\n\n- " + s.key_points.join("\n- ") : ""
            }`
        )
        .join("\n\n")
    : "";
  return `# ${report.title ?? type + " report"}\n\n${report.summary ?? ""}\n\n${sections}`;
}
