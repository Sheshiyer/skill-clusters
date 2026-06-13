#!/usr/bin/env node
// import-craft-skills.mjs — fold Craft workspace skills into the skill-clusters debloat model.
//
// This intentionally does NOT add the Craft skills directory to any scanned skill path. Instead it
// copies new skills into this repo's canonical skills/ directory, assigns them to cluster groupings,
// and regenerates skill-index.json so hooks can resolve them without startup-context bloat.
//
//   node scripts/import-craft-skills.mjs             # dry-run
//   node scripts/import-craft-skills.mjs --apply     # copy + update manifest/index

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const CRAFT = process.env.CRAFT_SKILLS_DIR || `${process.env.HOME}/.craft-agent/workspaces/my-workspace/skills`;
const SKILLS = path.join(REPO, 'skills');
const MANIFEST = path.join(REPO, 'skills.sh.json');
const PROFILES = path.join(REPO, 'profiles.json');
const INDEX = path.join(REPO, 'skill-index.json');
const AGENTS = path.join(os.homedir(), '.agents', 'skills');
const APPLY = process.argv.includes('--apply');

const EXPLEE = [
  'explee-master-orchestrator',
  'explee-product-search',
  'explee-product-enrichment',
  'explee-product-autogtm',
  'explee-product-ai-agents',
  'explee-api-cookie-access',
];

const CLUSTER_FOR = {
  'adaptability-coach': 'business-content',
  'arcplume': 'social-media',
  'audience-segmentation-generator': 'growth-content',
  'brand-story-builder': 'growth-content',
  'brandmint': 'design',
  'business-foundations-audit': 'business-content',
  'business-network-expansion': 'business-content',
  'career-advancement-planner': 'business-content',
  'career-transition-roadmap': 'business-content',
  'channel-prioritization-planner': 'growth-sales-cro',
  'concept-to-realworld-application-coach': 'business-content',
  'content-marketing-leadgen': 'growth-content',
  'core-values-designer': 'business-content',
  'corporate-communication-coach': 'business-content',
  'creativity-innovation-work-coach': 'business-content',
  'daily-priority-planner': 'ai-agents-meta',
  'elevator-pitch-generator': 'growth-sales-cro',
  'engagement-question-writer': 'growth-content',
  'five-whys-root-cause-analyzer': 'quality-eval',
  'fomo-copy-generator': 'growth-content',
  'headline-generator': 'growth-content',
  'interview-prep-coach': 'business-content',
  'job-search-strategy': 'business-content',
  'leadership-development-coach': 'business-content',
  'listicle-idea-generator': 'growth-content',
  'marketing-plan-generator': 'growth-content',
  'mental-health-workplace-conversation': 'business-content',
  'mission-vision-refiner': 'business-content',
  'mvp-roadmap-orchestrator': 'ai-agents-meta',
  'negotiation-skills-coach': 'growth-sales-cro',
  'newsletter-pas-writer': 'growth-content',
  'open-loop-social-writer': 'growth-content',
  'passive-income-planner': 'growth-sales-cro',
  'performance-feedback-writer': 'business-content',
  'personal-brand-strategy': 'growth-content',
  'persuasion-strategy-coach': 'growth-sales-cro',
  'portfolio-builder': 'business-content',
  'pricing-strategy-optimizer': 'growth-sales-cro',
  'product-launch-strategy': 'growth-content',
  'professional-development-curator': 'business-content',
  'professional-networking-playbook': 'business-content',
  'project-management-execution-coach': 'ai-agents-meta',
  'public-image-presentation-advisor': 'business-content',
  'real-estate-investment-evaluator': 'growth-sales-cro',
  'recognition-rewards-system-designer': 'business-content',
  'referral-program-designer': 'growth-sales-cro',
  'remote-productivity-coach': 'business-content',
  'resilience-during-tough-periods': 'business-content',
  'resume-enhancer': 'business-content',
  'safvr-brand-design-guardrails': 'design',
  'sales-funnel-designer': 'growth-sales-cro',
  'skill-development-planner': 'business-content',
  'smart-goal-coach': 'ai-agents-meta',
  'specialization-vs-diversification-advisor': 'growth-sales-cro',
  'startup-idea-generator': 'growth-content',
  'team-building-strategist': 'business-content',
  'twitter-thread-aida-writer': 'growth-content',
  'unmet-needs-analyzer': 'growth-content',
  'value-proposition-crafter': 'growth-sales-cro',
  'viral-campaign-ideator': 'growth-content',
  'work-life-balance-planner': 'business-content',
  'workplace-conflict-resolver': 'business-content',
  'workplace-culture-onboarding': 'business-content',
  'writing-editor-proofreader': 'growth-content',
};
for (const name of EXPLEE) CLUSTER_FOR[name] = 'explee-master';

const quote = (value) => JSON.stringify(String(value).replace(/\s+/g, ' ').trim());

function listCraftSkills() {
  return fs.readdirSync(CRAFT)
    .filter((name) => fs.existsSync(path.join(CRAFT, name, 'SKILL.md')))
    .sort();
}

function readIndex() {
  try { return JSON.parse(fs.readFileSync(INDEX, 'utf8')).skills || {}; } catch { return {}; }
}

function normalizeSkillMarkdown(markdown, name, cluster) {
  const end = markdown.startsWith('---') ? markdown.indexOf('\n---', 3) : -1;
  const body = end >= 0 ? markdown.slice(end + 4).replace(/^\r?\n/, '') : markdown;
  const block = end >= 0 ? markdown.slice(3, end).replace(/\r/g, '') : '';
  const kept = block
    .split('\n')
    .filter((line) => !/^(name|description|cluster|version|origin):\s?/.test(line))
    .filter((line, index, lines) => !(line.trim() === '' && (index === 0 || index === lines.length - 1)));

  const existingDescription = (block.match(/^description:\s?(.*)$/m)?.[1] || '')
    .replace(/^['"]|['"]$/g, '')
    .trim();
  const description = /use when/i.test(existingDescription)
    ? existingDescription
    : `${existingDescription} USE WHEN a task matches the Craft workspace workflow for ${name}.`;

  const frontmatter = [
    '---',
    `name: ${name}`,
    `description: ${quote(description.length >= 40 ? description : `USE WHEN a task requires the imported Craft workspace skill ${name}.`)}`,
    `cluster: ${cluster}`,
    'version: 1.0.0',
    'origin: "craft-agent workspace"',
    ...kept,
    '---',
    '',
  ].join('\n');
  return frontmatter + body;
}

function ensureGrouping(manifest, cluster) {
  const existing = (manifest.groupings || []).find((g) => (g.skills || []).includes(`${cluster}-orchestrator`));
  if (existing) return existing;
  if (cluster !== 'explee-master') throw new Error(`No grouping found for cluster: ${cluster}`);
  const grouping = {
    title: 'Explee — Search · Enrichment · AI Agents · AutoGTM',
    description: 'Route an Explee task to the right product workflow — company/people search, email enrichment, pre-built or custom AI agent runs, AutoGTM pipelines, and cookie/API-key auth fallback. USE WHEN a user asks to operate Explee product APIs or build an Explee-powered GTM workflow.',
    skills: [...EXPLEE],
  };
  manifest.groupings.push(grouping);
  return grouping;
}

const index = readIndex();
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const profiles = JSON.parse(fs.readFileSync(PROFILES, 'utf8'));
const craftNames = listCraftSkills();
const imported = [];
const skipped = [];
const plannedByCluster = new Map();

for (const name of craftNames) {
  const existsInRepo = fs.existsSync(path.join(SKILLS, name));
  const existsInIndex = Boolean(index[name]);
  const existsLive = fs.existsSync(path.join(AGENTS, name));
  const cluster = CLUSTER_FOR[name];
  if (existsInIndex || existsInRepo || existsLive) {
    skipped.push({ name, reason: existsInIndex ? `indexed:${index[name].status}` : existsInRepo ? 'repo-exists' : 'live-skill-exists' });
    continue;
  }
  if (!cluster) {
    skipped.push({ name, reason: 'no-cluster-mapping' });
    continue;
  }
  if (!plannedByCluster.has(cluster)) plannedByCluster.set(cluster, []);
  plannedByCluster.get(cluster).push(name);
}

for (const [cluster, names] of plannedByCluster) {
  const grouping = ensureGrouping(manifest, cluster);
  for (const name of names) {
    if (!grouping.skills.includes(name)) grouping.skills.push(name);
  }
}

profiles.tiers ||= { active: [], deferred: [] };
if (!profiles.tiers.active.includes('explee-master') && !profiles.tiers.deferred.includes('explee-master')) {
  profiles.tiers.deferred.push('explee-master');
}

for (const [cluster, names] of plannedByCluster) {
  for (const name of names) {
    imported.push({ name, cluster });
    if (!APPLY) continue;
    const source = path.join(CRAFT, name);
    const destination = path.join(SKILLS, name);
    fs.cpSync(source, destination, { recursive: true, errorOnExist: true });
    const skillPath = path.join(destination, 'SKILL.md');
    const normalized = normalizeSkillMarkdown(fs.readFileSync(skillPath, 'utf8'), name, cluster);
    fs.writeFileSync(skillPath, normalized);
  }
}

if (APPLY) {
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(PROFILES, JSON.stringify(profiles, null, 2) + '\n');
  execFileSync('node', [path.join(__dirname, 'gen-index.mjs')], { stdio: 'inherit' });
}

console.log(`${APPLY ? '' : '[dry-run] '}craft import: ${imported.length} new skill(s), ${skipped.length} skipped`);
for (const [cluster, names] of plannedByCluster) console.log(`  ${cluster}: ${names.length} -> ${names.join(', ')}`);
if (skipped.length) {
  console.log('  skipped:');
  for (const item of skipped) console.log(`    ${item.name}: ${item.reason}`);
}
