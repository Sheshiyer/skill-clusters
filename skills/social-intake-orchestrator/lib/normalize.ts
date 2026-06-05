import type { SocialItem } from "./types";
import type { FetchResult } from "./fetch";
import { updateStage } from "./status";

export function normalizeAll(raw: FetchResult): SocialItem[] {
  updateStage("normalize", { status: "running" });

  const items: SocialItem[] = [];

  // Normalize Twitter items
  for (const tweet of raw.twitter as any[]) {
    items.push(normalizeTwitter(tweet));
  }

  // Normalize Instagram items
  for (const ig of raw.instagram) {
    try {
      items.push(normalizeInstagram(ig.json));
    } catch {
      // skip malformed entries
    }
  }

  updateStage("normalize", { status: "completed", count: items.length });
  console.log(`Normalized: ${items.length} items`);
  return items;
}

function normalizeTwitter(tweet: any): SocialItem {
  return {
    id: tweet.id,
    source: "twitter",
    author: {
      handle: tweet.author?.username || "unknown",
      name: tweet.author?.name || "Unknown",
    },
    text: tweet.text || "",
    media: (tweet.media || []).map((m: any) => ({
      type: m.type === "video" ? "video" : "image",
      url: m.videoUrl || m.url || "",
    })),
    url: `https://x.com/${tweet.author?.username || "i"}/status/${tweet.id}`,
    date: tweet.createdAt ? new Date(tweet.createdAt).toISOString() : new Date().toISOString(),
    thread: tweet.conversationId && tweet.conversationId !== tweet.id
      ? { position: 0, total: 0, parentId: tweet.conversationId }
      : undefined,
    engagement: {
      likes: tweet.likeCount || 0,
      shares: tweet.retweetCount || 0,
    },
    raw: tweet,
  };
}

function normalizeInstagram(data: any): SocialItem {
  const node = data.node || data;
  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || "";
  const shortcode = node.shortcode || "unknown";
  const owner = node.owner?.username || "unknown";
  const ownerName = node.owner?.full_name || owner;
  const timestamp = node.taken_at_timestamp;
  const date = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();

  const media: SocialItem["media"] = [];
  if (node.__typename === "GraphVideo" || node.__typename === "XDTGraphVideo") {
    media.push({ type: "video", url: node.video_url || node.display_url || "" });
  } else if (node.__typename === "GraphImage" || node.__typename === "XDTGraphImage") {
    media.push({ type: "image", url: node.display_url || "" });
  } else if (node.__typename === "GraphSidecar" || node.__typename === "XDTGraphSidecar") {
    const edges = node.edge_sidecar_to_children?.edges || [];
    for (const edge of edges) {
      const child = edge.node;
      media.push({
        type: child.is_video ? "video" : "image",
        url: child.video_url || child.display_url || "",
      });
    }
  }

  return {
    id: shortcode,
    source: "instagram",
    author: { handle: owner, name: ownerName },
    text: caption,
    media,
    url: `https://www.instagram.com/p/${shortcode}/`,
    date,
    engagement: {
      likes: node.edge_media_preview_like?.count || 0,
      shares: 0,
    },
    raw: data,
  };
}
