#!/usr/bin/env node
// selemene-report/Tools/Report.ts — thin CLI wrapper for generating Selemene reports.
// This tool routes to existing backend surfaces; it does NOT contain report logic.

import { parseArgs } from "node:util";
import path from "node:path";
import fs from "node:fs";
import { resolveConfig } from "./lib/resolve-config.ts";
import { writeManifest } from "./lib/write-manifest.ts";
import { witnessPromptFor } from "./lib/prompts.ts";
import {
  renderMarkdownReport,
  renderWorkflowMarkdownReport,
} from "./lib/reports.ts";
import {
  buildDeterministicEngineInput,
  deterministicWorkflowId,
  subjectNameFromPayload,
  type EngineInput,
} from "./lib/engine-input.ts";

type ReportType = "birth" | "compatibility" | "transit" | "witness";
type DeterministicType = "birth" | "compatibility" | "transit";

export interface Fetcher {
  (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string }
  ): Promise<Response>;
}

const USAGE = `
Usage:
  bun run Tools/Report.ts birth "Name" "ISO_DATETIME" "Location" [--output-dir DIR] [--format text|html|json|pdf]
  bun run Tools/Report.ts compatibility --person1 "Name" DATETIME LOC --person2 "Name" DATETIME LOC [--output-dir DIR]
  bun run Tools/Report.ts transit "Name" "ISO_DATETIME" "Location" --from YYYY-MM-DD --to YYYY-MM-DD [--output-dir DIR]
  bun run Tools/Report.ts witness --mode solo|dyadic --subjects PATH [--level L1-L5] [--output-dir DIR]
`;

function assertType(arg: string): ReportType {
  if (["birth", "compatibility", "transit", "witness"].includes(arg)) {
    return arg as ReportType;
  }
  throw new Error(`Unknown report type: ${arg}\n${USAGE}`);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function nowTimestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
}

export interface DeterministicConfig {
  rustUrl: string;
  apiKey?: string;
  devBypassToken?: string;
}

export async function generateDeterministicImpl(
  type: DeterministicType,
  outputDir: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>,
  config: DeterministicConfig,
  fetcher: Fetcher = fetch
): Promise<{ artifactPath: string; extension: string }> {
  const workflowId = deterministicWorkflowId(type);
  const endpoint = `${config.rustUrl}/api/v1/workflows/${workflowId}/execute`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
  if (config.devBypassToken) headers["x-noesis-dev-auth"] = config.devBypassToken;

  const res = await fetcher(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Report backend returned ${res.status}: ${body}`);
  }
  const report = await res.json();

  // Default artifact is markdown; JSON report is serialized if the backend returns structured data.
  const extension = payload.format === "json" ? "json" : "md";
  const timestamp = nowTimestamp();
  const nameSlug = slugify(
    report.subject_name ?? subjectNameFromPayload(type, payload) ?? `selemene-${type}`
  );
  const artifactPath = path.join(
    outputDir,
    `${type}-${nameSlug}-${timestamp}.${extension}`
  );

  fs.mkdirSync(outputDir, { recursive: true });
  const content =
    extension === "json"
      ? JSON.stringify(report, null, 2)
      : renderWorkflowMarkdownReport(report, type, subjectNameFromPayload(type, payload));
  fs.writeFileSync(artifactPath, content, "utf-8");

  return { artifactPath, extension };
}

async function generateDeterministic(
  type: DeterministicType,
  outputDir: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>
): Promise<{ artifactPath: string; extension: string }> {
  const base = resolveConfig();
  return generateDeterministicImpl(type, outputDir, payload, {
    rustUrl: base.rustUrl,
    apiKey: base.apiKey,
    devBypassToken: process.env.CF_DEV_BYPASS_TOKEN,
  });
}

export interface WitnessSubject {
  role?: string;
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_time_confidence?: string;
  birth_location_query?: string;
  normalized_location?: {
    display_name: string;
    latitude: number;
    longitude: number;
    timezone: string;
    provider?: string;
    confidence?: string;
  };
}

export interface WitnessConfig {
  rustUrl: string;
  apiKey?: string;
  devBypassToken?: string;
}

function mapWitnessMode(mode: string): string {
  // Rust /api/v1/assets/generate accepts mode strings such as
  // "integrated-reading" (solo) and "composite-dyad" (dyadic).
  switch (mode) {
    case "solo":
      return "integrated-reading";
    case "dyadic":
      return "composite-dyad";
    default:
      return mode;
  }
}

function validateWitnessSubjects(subjects: WitnessSubject[]): void {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error("witness requires at least one subject in subjects.json");
  }
  for (const subject of subjects) {
    if (!subject.normalized_location) {
      throw new Error(
        `Subject ${subject.name ?? "(unknown)"} is missing normalized_location. ` +
          "The Rust /api/v1/assets/generate endpoint requires every subject to include " +
          "a normalized_location object with display_name, latitude, longitude, and timezone."
      );
    }
  }
}

export async function generateWitnessImpl(
  mode: string,
  subjectsPath: string,
  level: string,
  outputDir: string,
  config: WitnessConfig,
  fetcher: Fetcher = fetch
): Promise<{ artifactPath: string }> {
  const subjects: WitnessSubject[] = JSON.parse(fs.readFileSync(subjectsPath, "utf-8"));
  validateWitnessSubjects(subjects);

  const payload = {
    mode: mapWitnessMode(mode),
    report_level: level,
    subjects,
  };

  // Live assembled witness readings are produced by the Rust
  // POST /api/v1/assets/generate endpoint. ts-engines exposes only generic
  // /engines/:id/calculate and has no /witness/generate route.
  const endpoint = `${config.rustUrl}/api/v1/assets/generate`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
  if (config.devBypassToken) headers["x-noesis-dev-auth"] = config.devBypassToken;

  const res = await fetcher(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Witness backend returned ${res.status}: ${body}`);
  }
  const reading = await res.json();

  const timestamp = nowTimestamp();
  const subjectNames = Array.isArray(subjects)
    ? subjects.map((s) => s.name).filter(Boolean)
    : [];
  const nameSlug =
    subjectNames.length > 0
      ? slugify(subjectNames.join("-"))
      : `witness-${mode}`;
  const artifactPath = path.join(
    outputDir,
    `witness-${mode}-${nameSlug}-${timestamp}.md`
  );

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(artifactPath, reading.assembled ?? reading.markdown ?? "", "utf-8");

  return { artifactPath };
}

async function generateWitness(
  mode: string,
  subjectsPath: string,
  level: string,
  outputDir: string
): Promise<{ artifactPath: string }> {
  const base = resolveConfig();
  return generateWitnessImpl(mode, subjectsPath, level, outputDir, {
    rustUrl: base.rustUrl,
    apiKey: base.apiKey,
    devBypassToken: process.env.CF_DEV_BYPASS_TOKEN,
  });
}

export interface ParsedArgs {
  type: ReportType;
  outputDir: string;
  values: Record<string, string | string[] | undefined>;
  positionals: string[];
}

export function parseReportArgs(args: string[]): ParsedArgs {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      "output-dir": { type: "string" },
      format: { type: "string" },
      person1: { type: "string", multiple: true },
      person2: { type: "string", multiple: true },
      from: { type: "string" },
      to: { type: "string" },
      mode: { type: "string" },
      subjects: { type: "string" },
      level: { type: "string" },
    },
  });

  if (positionals.length < 1) {
    throw new Error(USAGE);
  }

  const type = assertType(positionals[0]);
  const outputDir =
    (values["output-dir"] as string | undefined) ??
    process.env.SELEMENE_OUTPUT_DIR ??
    "./selemene-reports";

  return { type, outputDir, values, positionals };
}

async function main(): Promise<void> {
  const { type, outputDir, values, positionals } = parseReportArgs(
    process.argv.slice(2)
  );
  fs.mkdirSync(outputDir, { recursive: true });

  let artifactPath: string;

  switch (type) {
    case "birth": {
      const [name, datetime, location] = positionals.slice(1);
      if (!name || !datetime || !location) {
        throw new Error(`birth requires name, datetime, location\n${USAGE}`);
      }
      const payload = buildDeterministicEngineInput("birth", { name, datetime, location });
      (payload as Record<string, unknown>).format = values.format ?? "text";
      const { artifactPath: ap } = await generateDeterministic("birth", outputDir, payload);
      artifactPath = ap;
      break;
    }
    case "compatibility": {
      const p1 = values.person1 as string[] | undefined;
      const p2 = values.person2 as string[] | undefined;
      if (!p1 || p1.length < 3 || !p2 || p2.length < 3) {
        throw new Error(
          `compatibility requires --person1 and --person2 each with name, datetime, location\n${USAGE}`
        );
      }
      const payload = buildDeterministicEngineInput("compatibility", {
        person1: { name: p1[0], datetime: p1[1], location: p1[2] },
        person2: { name: p2[0], datetime: p2[1], location: p2[2] },
      });
      const { artifactPath: ap } = await generateDeterministic(
        "compatibility",
        outputDir,
        payload
      );
      artifactPath = ap;
      break;
    }
    case "transit": {
      const [name, datetime, location] = positionals.slice(1);
      if (!name || !datetime || !location || !values.from || !values.to) {
        throw new Error(
          `transit requires name, datetime, location, --from, --to\n${USAGE}`
        );
      }
      const payload = buildDeterministicEngineInput("transit", {
        name,
        datetime,
        location,
        from_date: values.from,
        to_date: values.to,
      });
      const { artifactPath: ap } = await generateDeterministic("transit", outputDir, payload);
      artifactPath = ap;
      break;
    }
    case "witness": {
      const mode = (values.mode as string) ?? "solo";
      const subjectsPath = values.subjects as string | undefined;
      const level = (values.level as string) ?? "L3";
      if (!subjectsPath) {
        throw new Error(`witness requires --subjects PATH\n${USAGE}`);
      }
      const { artifactPath: ap } = await generateWitness(
        mode,
        subjectsPath,
        level,
        outputDir
      );
      artifactPath = ap;
      break;
    }
  }

  const manifestPath = await writeManifest({
    reportType: type,
    outputDir,
    artifactPath,
    subjectCount:
      type === "compatibility" ? 2 : type === "witness" ? "dynamic" : 1,
    prompt: witnessPromptFor(type),
  });

  console.log(JSON.stringify({ artifact_path: artifactPath, manifest_path: manifestPath, prompt: witnessPromptFor(type) }, null, 2));
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
