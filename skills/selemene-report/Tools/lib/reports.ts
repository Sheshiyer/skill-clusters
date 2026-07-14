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

export interface WorkflowReport {
  workflow_id?: string;
  engine_outputs?: Record<
    string,
    {
      engine_id: string;
      result?: Record<string, unknown>;
      witness_prompt?: string;
      consciousness_level?: number;
      metadata?: Record<string, unknown>;
    }
  >;
  synthesis?: Record<string, unknown> | null;
  total_time_ms?: number;
  timestamp?: string;
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

export function renderWorkflowMarkdownReport(
  report: WorkflowReport,
  type: string,
  subjectName?: string
): string {
  const title = `${type} report — ${report.workflow_id ?? type}`;
  const header = `# ${title}\n\nSubject: ${subjectName ?? "(unspecified)"}\nGenerated: ${report.timestamp ?? new Date().toISOString()}\n`;

  const engineIds = Object.keys(report.engine_outputs ?? {});
  if (engineIds.length === 0) {
    return `${header}\nNo engine outputs.\n`;
  }

  const sections = engineIds
    .map((engineId) => {
      const output = report.engine_outputs![engineId];
      const result = output.result ?? {};
      const lines: string[] = [`## ${engineId}`];

      // Render a few known top-level fields as readable bullets.
      for (const [key, value] of Object.entries(result)) {
        if (value === null || value === undefined) continue;
        if (typeof value === "object" && !Array.isArray(value)) {
          lines.push(`- **${key}**: ${JSON.stringify(value, null, 2).split("\n").join("\n  ")}`);
        } else if (Array.isArray(value)) {
          lines.push(`- **${key}**: ${value.length} entries`);
          value.slice(0, 8).forEach((v) => lines.push(`  - ${typeof v === "object" ? JSON.stringify(v) : v}`));
        } else {
          lines.push(`- **${key}**: ${value}`);
        }
      }

      if (output.witness_prompt) {
        lines.push(`\n*Witness prompt:* ${output.witness_prompt}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  return `${header}\n${sections}\n`;
}
