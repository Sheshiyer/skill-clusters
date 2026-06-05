#!/usr/bin/env bun
/**
 * Social Intake Orchestrator
 *
 * Chains: HARPOON-ACTIONS → FETCH → NORMALIZE → DEDUPE → THREAD-EXPAND → ENRICH →
 *         OPPORTUNITY → TRANSCRIPT → ROUTE → WRITE → CLUSTER → DECAY
 * Writes pipeline status to ~/.config/harpoon/pipeline.json for Harpoon Pro monitoring.
 */

import { fetchAll } from "./fetch";
import { normalizeAll } from "./normalize";
import { dedupeItems } from "./dedupe";
import { expandThreads } from "./thread-expand";
import { enrichItems } from "./enrich";
import { scanOpportunities } from "./opportunity";
import { extractTranscripts } from "./transcript";
import { writeItems } from "./write";
import { processHarpoonActions, ensureActionsFile } from "./harpoon-actions";
import { clusterAndGenerateMOCs } from "./cluster";
import { runDecayScoring } from "./decay";
import { initStatus, completeStatus, errorStatus } from "./status";

async function main() {
  console.log("=== Social Intake Pipeline ===");
  console.log(`Started: ${new Date().toISOString()}`);

  initStatus();
  ensureActionsFile();

  try {
    // Stage 0: Process pending Harpoon actions (reclassify, reject, retag)
    console.log("\n--- Stage 0: HARPOON ACTIONS ---");
    const { processed: actionsProcessed } = processHarpoonActions();
    if (actionsProcessed > 0) {
      console.log(`  Processed ${actionsProcessed} Harpoon actions`);
    }

    // Stage 1: FETCH
    console.log("\n--- Stage 1: FETCH ---");
    const raw = fetchAll();

    if (raw.twitter.length === 0 && raw.instagram.length === 0) {
      if (raw.errors.length > 0) {
        console.log("Both sources failed:", raw.errors.join("; "));
        errorStatus("Both sources failed: " + raw.errors.join("; "));
        process.exit(1);
      }
      console.log("No new bookmarks found.");

      // Still run decay scoring even with no new items
      console.log("\n--- Stage 8: DECAY SCORING ---");
      const decay = runDecayScoring();
      if (decay.flagged > 0) {
        console.log(`  ${decay.flagged} stale notes flagged for review`);
      }

      completeStatus();
      return;
    }

    // Stage 2: NORMALIZE
    console.log("\n--- Stage 2: NORMALIZE ---");
    const normalized = normalizeAll(raw);

    // Stage 3: DEDUPE
    console.log("\n--- Stage 3: DEDUPE ---");
    const { passed, skipped } = dedupeItems(normalized);

    if (passed.length === 0) {
      console.log("All items already ingested. Nothing to do.");

      // Still run decay scoring
      console.log("\n--- Stage 8: DECAY SCORING ---");
      runDecayScoring();

      completeStatus();
      return;
    }

    // Stage 4: THREAD EXPANSION (Twitter only)
    console.log("\n--- Stage 4: THREAD EXPAND ---");
    const threads = expandThreads(passed);

    // Stage 5: ENRICH
    console.log("\n--- Stage 5: ENRICH ---");
    const enriched = await enrichItems(passed);

    // Stage 6: OPPORTUNITY SCAN
    console.log("\n--- Stage 6: OPPORTUNITY SCAN ---");
    const opportunities = scanOpportunities(enriched);

    // Stage 6b: TRANSCRIPT EXTRACTION (video bookmarks only)
    console.log("\n--- Stage 6b: TRANSCRIPT EXTRACT ---");
    const transcripts = extractTranscripts(enriched);

    // Stage 7: ROUTE + WRITE (with all enrichments)
    console.log("\n--- Stage 7: ROUTE + WRITE ---");
    const { written, errors } = writeItems(enriched, { threads, opportunities, transcripts });

    // Stage 7b: CLUSTER + MOC
    console.log("\n--- Stage 7b: CLUSTER + MOC ---");
    const { clusters, mocsWritten } = clusterAndGenerateMOCs(enriched);

    // Stage 8: DECAY SCORING
    console.log("\n--- Stage 8: DECAY SCORING ---");
    const decay = runDecayScoring();

    // Done
    completeStatus();

    console.log("\n=== Pipeline Complete ===");
    console.log(`  New items: ${passed.length}`);
    console.log(`  Skipped (dupes): ${skipped}`);
    console.log(`  Threads resolved: ${threads.size}`);
    console.log(`  Opportunities scanned: ${opportunities.size}`);
    console.log(`  Transcripts extracted: ${[...transcripts.values()].filter((t) => t.source !== "none").length}`);
    console.log(`  Written: ${written.length}`);
    console.log(`  Clusters: ${clusters.length}, MOCs written: ${mocsWritten.length}`);
    console.log(`  Stale notes flagged: ${decay.flagged}`);
    if (errors.length) console.log(`  Errors: ${errors.length}`);
    console.log(`  Fetch warnings: ${raw.errors.length ? raw.errors.join("; ") : "none"}`);
  } catch (err: any) {
    console.error("Pipeline failed:", err.message);
    errorStatus(err.message);
    process.exit(1);
  }
}

main();
