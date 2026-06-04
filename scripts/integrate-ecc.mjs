#!/usr/bin/env node
// integrate-ecc.mjs — one-time: merge the 21 extracted ECC clusters into skills.sh.json.
// For each cluster: grouping.skills = [<handle>-orchestrator, <handle>-core] + candidate spokes
// that actually survived the agent's triage (i.e. exist on disk). Idempotent: skips clusters
// whose orchestrator is already in a grouping. Title from handle; description from the
// orchestrator's frontmatter.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = path.join(REPO, 'skills');
const MANIFEST = path.join(REPO, 'skills.sh.json');

const CLUSTERS = {
  'rust': ['rust-patterns', 'rust-testing'],
  'native-ios': ['swiftui-patterns', 'swift-concurrency-6-2', 'swift-actor-persistence', 'swift-protocol-di-testing', 'foundation-models-on-device', 'mobile-ios-design', 'ios-icon-gen', 'liquid-glass-design'],
  'ai-agents-meta': ['agentic-engineering', 'agentic-os', 'agent-architecture-audit', 'agent-introspection-debugging', 'prompt-optimizer', 'token-budget-advisor', 'cost-aware-llm-pipeline', 'team-agent-orchestration', 'team-builder', 'continuous-agent-loop', 'dynamic-workflow-mode', 'blueprint', 'search-first', 'plan-orchestrate', 'claude-devfleet', 'nanoclaw-repl', 'regex-vs-llm-structured-text', 'data-scraper-agent', 'content-hash-cache-pattern', 'council', 'continuous-learning-v2'],
  'quality-eval': ['eval-harness', 'agent-eval', 'tdd-workflow', 'verification-loop', 'e2e-testing', 'windows-desktop-e2e', 'ai-regression-testing', 'error-handling', 'production-audit', 'plankton-code-quality', 'browser-qa', 'iterative-retrieval', 'agent-sort', 'benchmark', 'benchmark-optimization-loop', 'latency-critical-systems', 'parallel-execution-optimizer'],
  'frontend-web': ['react-patterns', 'react-performance', 'react-testing', 'frontend-patterns', 'frontend-design-direction', 'frontend-a11y', 'accessibility', 'design-system', 'make-interfaces-feel-better', 'ui-to-vue', 'angular-developer', 'nextjs-turbopack', 'nuxt4-patterns', 'vite-patterns', 'bun-runtime', 'frontend-slides', 'motion-foundations', 'motion-patterns', 'motion-advanced', 'motion-ui'],
  'python-backend': ['python-patterns', 'python-testing', 'django-patterns', 'django-tdd', 'django-verification', 'django-security', 'django-celery', 'fastapi-patterns', 'pytorch-patterns', 'recsys-pipeline-architect', 'mle-workflow'],
  'jvm': ['kotlin-patterns', 'kotlin-coroutines-flows', 'kotlin-exposed-patterns', 'kotlin-ktor-patterns', 'kotlin-testing', 'java-coding-standards', 'springboot-patterns', 'springboot-tdd', 'springboot-verification', 'springboot-security', 'quarkus-patterns', 'quarkus-tdd', 'quarkus-verification', 'quarkus-security', 'jpa-patterns', 'tinystruct-patterns', 'compose-multiplatform-patterns', 'dotnet-patterns', 'csharp-testing', 'fsharp-testing'],
  'php-laravel': ['laravel-patterns', 'laravel-tdd', 'laravel-verification', 'laravel-security', 'laravel-plugin-discovery'],
  'systems-languages': ['golang-patterns', 'golang-testing', 'cpp-coding-standards', 'cpp-testing', 'perl-patterns', 'perl-testing', 'perl-security'],
  'mobile-flutter': ['dart-flutter-patterns', 'flutter-dart-code-review', 'android-clean-architecture'],
  'backend-architecture': ['backend-patterns', 'api-design', 'api-connector-builder', 'mcp-server-patterns', 'nestjs-patterns', 'hexagonal-architecture', 'architecture-decision-records', 'coding-standards', 'deployment-patterns'],
  'databases-data': ['postgres-patterns', 'mysql-patterns', 'prisma-patterns', 'clickhouse-io', 'redis-patterns', 'database-migrations', 'data-throughput-accelerator'],
  'devops-infra': ['docker-patterns', 'cisco-ios-patterns', 'netmiko-ssh-automation', 'network-bgp-diagnostics', 'network-config-validation', 'network-interface-health', 'homelab-network-readiness', 'homelab-network-setup', 'homelab-pihole-dns', 'homelab-vlan-segmentation', 'homelab-wireguard-vpn', 'flox-environments', 'uncloud', 'canary-watch'],
  'security': ['security-review', 'security-scan', 'security-bounty-hunter', 'repo-scan', 'click-path-audit', 'gateguard', 'safety-guard'],
  'healthcare': ['hipaa-compliance', 'healthcare-phi-compliance', 'healthcare-cdss-patterns', 'healthcare-emr-patterns', 'healthcare-eval-harness'],
  'blockchain-web3': ['defi-amm-security', 'evm-token-decimals', 'llm-trading-agent-security', 'prediction-market-oracle-research', 'prediction-market-risk-review', 'ito-basket-compare', 'ito-data-atlas-agent', 'ito-market-intelligence', 'ito-trade-planner', 'nodejs-keccak256'],
  'research-knowledge': ['deep-research', 'exa-search', 'research-ops', 'scientific-db-pubmed-database', 'scientific-db-uspto-database', 'scientific-pkg-gget', 'scientific-thinking-literature-review', 'scientific-thinking-scholar-evaluation', 'codebase-onboarding', 'code-tour', 'documentation-lookup', 'ck'],
  'business-content': ['article-writing', 'brand-voice', 'content-engine', 'seo', 'market-research', 'marketing-campaign', 'investor-materials', 'investor-outreach', 'lead-intelligence', 'social-graph-ranker', 'product-capability', 'product-lens'],
  'social-media': ['x-api', 'social-publisher', 'crosspost', 'fal-ai-media', 'videodb', 'video-editing', 'remotion-video-creation', 'manim-video', 'blender-motion-state-inspection', 'ui-demo', 'nutrient-document-processing', 'visa-doc-translate'],
  'agentic-ops': ['email-ops', 'messages-ops', 'github-ops', 'jira-integration', 'google-workspace-ops', 'project-flow-ops', 'unified-notifications-ops', 'terminal-ops', 'knowledge-ops', 'customer-billing-ops', 'finance-billing-ops', 'automation-audit-ops', 'workspace-surface-audit', 'connections-optimizer', 'dashboard-builder', 'git-workflow'],
  'supply-chain': ['carrier-relationship-management', 'customs-trade-compliance', 'energy-procurement', 'inventory-demand-planning', 'logistics-exception-management', 'production-scheduling', 'quality-nonconformance', 'returns-reverse-logistics'],
};

const exists = (n) => fs.existsSync(path.join(SKILLS, n, 'SKILL.md'));
const titleCase = (h) => h.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
function fmDesc(n) {
  try {
    const t = fs.readFileSync(path.join(SKILLS, n, 'SKILL.md'), 'utf8');
    const m = t.match(/^description:\s*(.+)$/m);
    if (m) { let v = m[1].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); return v; }
  } catch {}
  return '';
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
let added = 0;
for (const [handle, cands] of Object.entries(CLUSTERS)) {
  const orch = `${handle}-orchestrator`, core = `${handle}-core`;
  if (!exists(orch) || !exists(core)) { console.log(`skip ${handle} (incomplete on disk)`); continue; }
  if (manifest.groupings.some((g) => (g.skills || []).includes(orch))) { console.log(`exists ${handle}`); continue; }
  const skills = [orch, core, ...cands.filter(exists)];
  manifest.groupings.push({
    title: `${titleCase(handle)} (from ECC)`,
    description: fmDesc(orch) || `The ${titleCase(handle)} cluster, extracted from affaan-m/ECC (MIT).`,
    skills,
  });
  added++;
  console.log(`+ ${handle}: ${skills.length} skills`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nadded ${added} groupings; total ${manifest.groupings.length}`);
