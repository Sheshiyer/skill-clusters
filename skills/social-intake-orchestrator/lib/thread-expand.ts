/**
 * Thread Expansion — when a bookmarked tweet is part of a thread,
 * fetch the full thread via `bird thread` and stitch into the note.
 */
import { execSync } from "child_process";
import type { SocialItem } from "./types";
import { updateStage } from "./status";

export interface ThreadContext {
  tweets: { author: string; text: string; id: string }[];
  totalTweets: number;
}

export function expandThreads(items: SocialItem[]): Map<string, ThreadContext> {
  updateStage("thread-expand", { status: "running", total: items.length, done: 0 });

  const threads = new Map<string, ThreadContext>();
  let done = 0;

  for (const item of items) {
    if (item.source !== "twitter") {
      done++;
      continue;
    }

    // Check if tweet is part of a conversation
    const raw = item.raw as any;
    const conversationId = raw?.conversationId;

    if (conversationId && conversationId !== item.id) {
      // This tweet is a reply in a thread — fetch the full thread
      try {
        const stdout = execSync(`bird thread ${conversationId} --json`, {
          timeout: 30_000,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });

        const jsonStart = stdout.indexOf("[");
        if (jsonStart !== -1) {
          const threadTweets = JSON.parse(stdout.slice(jsonStart));
          threads.set(item.id, {
            tweets: threadTweets.map((t: any) => ({
              author: t.author?.username || "unknown",
              text: t.text || "",
              id: t.id,
            })),
            totalTweets: threadTweets.length,
          });
        }
      } catch {
        // Thread fetch failed — not critical, continue
      }
    } else {
      // Check if this tweet itself starts a thread (has replies from same author)
      try {
        const stdout = execSync(`bird thread ${item.id} --json`, {
          timeout: 30_000,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });

        const jsonStart = stdout.indexOf("[");
        if (jsonStart !== -1) {
          const threadTweets = JSON.parse(stdout.slice(jsonStart));
          if (threadTweets.length > 1) {
            threads.set(item.id, {
              tweets: threadTweets.map((t: any) => ({
                author: t.author?.username || "unknown",
                text: t.text || "",
                id: t.id,
              })),
              totalTweets: threadTweets.length,
            });
          }
        }
      } catch {
        // Not a thread or fetch failed — fine
      }
    }

    done++;
    updateStage("thread-expand", { status: "running", total: items.length, done });
  }

  updateStage("thread-expand", { status: "completed", count: threads.size });
  console.log(`Thread expansion: ${threads.size} threads resolved`);
  return threads;
}

/** Format thread context as markdown for inclusion in vault notes */
export function formatThread(ctx: ThreadContext): string {
  if (ctx.tweets.length <= 1) return "";

  const lines = ctx.tweets.map(
    (t, i) => `**${i + 1}/${ctx.totalTweets}** @${t.author}:\n> ${t.text.replace(/\n/g, "\n> ")}`
  );

  return `\n## Full Thread (${ctx.totalTweets} tweets)\n\n${lines.join("\n\n")}\n`;
}
