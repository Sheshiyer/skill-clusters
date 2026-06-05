// Shared types for the social intake pipeline

export interface SocialItem {
  id: string;
  source: "twitter" | "instagram";
  author: { handle: string; name: string };
  text: string;
  media: { type: "image" | "video"; url: string }[];
  url: string;
  date: string; // ISO 8601
  thread?: { position: number; total: number; parentId: string };
  engagement?: { likes: number; shares: number };
  raw: Record<string, unknown>;
}

export interface EnrichedItem extends SocialItem {
  summary: string;
  tags: string[];
  enneagramType: number;
  paraFolder: string;
}

export interface PipelineStatus {
  lastRun: string;
  status: "idle" | "running" | "completed" | "error";
  currentStage: string;
  stages: Record<
    string,
    { status: "pending" | "running" | "completed" | "error"; count?: number; done?: number; total?: number; skipped?: number }
  >;
  recentItems: { title: string; source: string; routed: string }[];
  error?: string;
}

export interface CursorStore {
  twitter?: { lastId: string; updatedAt: string };
  instagram?: { lastTimestamp: number; updatedAt: string };
}
