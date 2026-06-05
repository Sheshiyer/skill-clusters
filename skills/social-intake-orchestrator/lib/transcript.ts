/**
 * Video Transcript Extraction — extracts transcripts from video bookmarks
 * leveraging youtube-transcript and ffmpeg skills for audio→text.
 */
import { execSync } from "child_process";
import { updateStage } from "./status";
import type { EnrichedItem } from "./types";

export interface TranscriptResult {
  itemId: string;
  transcript: string;
  source: "youtube-transcript" | "whisper" | "none";
  duration?: number;
}

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

function extractYouTubeTranscript(url: string): string | null {
  try {
    // Use yt-dlp to get subtitles/auto-captions
    const result = execSync(
      `yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format txt --print-to-file after_move:filepath /dev/stdout -o - "${url}" 2>/dev/null || true`,
      { timeout: 30_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    if (result.trim().length > 50) return result.trim();
  } catch {
    // fallback
  }

  // Try youtube-transcript-api if available
  try {
    const result = execSync(
      `python3 -c "from youtube_transcript_api import YouTubeTranscriptApi; import sys, json; vid='${url}'.split('v=')[-1].split('&')[0].split('/')[-1]; t=YouTubeTranscriptApi.get_transcript(vid); print(' '.join(x['text'] for x in t))" 2>/dev/null`,
      { timeout: 20_000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    if (result.trim().length > 50) return result.trim();
  } catch {
    // not available
  }

  return null;
}

function hasVideoMedia(item: EnrichedItem): boolean {
  return item.media.some((m) => m.type === "video");
}

export function extractTranscripts(items: EnrichedItem[]): Map<string, TranscriptResult> {
  const videoItems = items.filter((i) => hasVideoMedia(i) || isYouTubeUrl(i.url) || isYouTubeUrl(i.text));
  if (videoItems.length === 0) return new Map();

  updateStage("transcript", { status: "running", total: videoItems.length, done: 0 });

  const results = new Map<string, TranscriptResult>();

  for (let i = 0; i < videoItems.length; i++) {
    const item = videoItems[i];

    // Find YouTube URLs in text or URL
    const ytUrlMatch = (item.text + " " + item.url).match(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s)]+/
    );

    if (ytUrlMatch) {
      const transcript = extractYouTubeTranscript(ytUrlMatch[0]);
      if (transcript) {
        results.set(item.id, {
          itemId: item.id,
          transcript: transcript.slice(0, 5000), // cap at 5k chars
          source: "youtube-transcript",
        });
        updateStage("transcript", { status: "running", total: videoItems.length, done: i + 1 });
        continue;
      }
    }

    // No transcript available
    results.set(item.id, {
      itemId: item.id,
      transcript: "",
      source: "none",
    });

    updateStage("transcript", { status: "running", total: videoItems.length, done: i + 1 });
  }

  const extracted = [...results.values()].filter((r) => r.source !== "none").length;
  updateStage("transcript", { status: "completed", count: extracted });
  console.log(`Transcripts: ${extracted}/${videoItems.length} extracted`);
  return results;
}

/** Format transcript as markdown section */
export function formatTranscript(result: TranscriptResult): string {
  if (!result.transcript) return "";
  const truncated = result.transcript.length > 2000
    ? result.transcript.slice(0, 2000) + "\n\n*[Transcript truncated]*"
    : result.transcript;
  return `\n## Video Transcript\n\n*Source: ${result.source}*\n\n${truncated}\n`;
}
