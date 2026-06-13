import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { extractYoutubeId } from "@/lib/worldCup/youtube";

type AdminClient = SupabaseClient<Database>;

export const WORLD_CUP_VIDEO_CATEGORIES = [
  "preview",
  "highlight",
  "press_conference",
  "fan_video",
  "general",
] as const;

export type WorldCupVideoCategory = (typeof WORLD_CUP_VIDEO_CATEGORIES)[number];

export type WorldCupVideo = {
  id: string;
  title: string;
  sourceLabel: string | null;
  youtubeId: string;
  category: WorldCupVideoCategory;
  relatedMatchId: string | null;
  relatedTeam: string | null;
  startsShowingAt: string | null;
  expiresAt: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
};

export type WorldCupVideoInput = {
  title: string;
  sourceLabel?: string | null;
  youtubeUrl: string;
  category: WorldCupVideoCategory;
  relatedMatchId?: string | null;
  relatedTeam?: string | null;
  startsShowingAt?: string | null;
  expiresAt?: string | null;
  priority?: number;
  isActive?: boolean;
};

function mapRow(row: Database["public"]["Tables"]["world_cup_videos"]["Row"]): WorldCupVideo {
  return {
    id: row.id,
    title: row.title,
    sourceLabel: row.source_label,
    youtubeId: row.youtube_id,
    category: row.category as WorldCupVideoCategory,
    relatedMatchId: row.related_match_id,
    relatedTeam: row.related_team,
    startsShowingAt: row.starts_showing_at,
    expiresAt: row.expires_at,
    priority: row.priority,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function isVisibleNow(
  row: Database["public"]["Tables"]["world_cup_videos"]["Row"],
  now: Date,
): boolean {
  if (!row.is_active) {
    return false;
  }

  if (row.starts_showing_at && new Date(row.starts_showing_at).getTime() > now.getTime()) {
    return false;
  }

  if (row.expires_at && new Date(row.expires_at).getTime() <= now.getTime()) {
    return false;
  }

  return true;
}

function selectionTier(
  row: Database["public"]["Tables"]["world_cup_videos"]["Row"],
  matchId: string,
  teams: string[],
): number {
  if (row.related_match_id && row.related_match_id === matchId) {
    return 3;
  }

  if (row.related_team && teams.includes(row.related_team)) {
    return 2;
  }

  if (!row.related_match_id && !row.related_team) {
    return 1;
  }

  return 0;
}

export function pickFeaturedWorldCupVideo(
  rows: Database["public"]["Tables"]["world_cup_videos"]["Row"][],
  {
    matchId,
    homeTeam,
    awayTeam,
    now = new Date(),
  }: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    now?: Date;
  },
): WorldCupVideo | null {
  const teams = [homeTeam, awayTeam].filter(Boolean);

  const ranked = rows
    .filter((row) => isVisibleNow(row, now))
    .map((row) => ({ row, tier: selectionTier(row, matchId, teams) }))
    .filter((entry) => entry.tier > 0)
    .sort((a, b) => {
      if (b.tier !== a.tier) {
        return b.tier - a.tier;
      }

      if (b.row.priority !== a.row.priority) {
        return b.row.priority - a.row.priority;
      }

      return new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime();
    });

  const winner = ranked[0]?.row;
  return winner ? mapRow(winner) : null;
}

export async function listActiveWorldCupVideos(admin: AdminClient) {
  const { data, error } = await admin
    .from("world_cup_videos")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { videos: null as WorldCupVideo[] | null, error: error.message };
  }

  return { videos: (data ?? []).map(mapRow), error: null };
}

export async function getFeaturedWorldCupVideoForMatch(
  admin: AdminClient,
  {
    matchId,
    homeTeam,
    awayTeam,
    now = new Date(),
  }: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    now?: Date;
  },
) {
  const { data, error } = await admin.from("world_cup_videos").select("*").eq("is_active", true);

  if (error) {
    return { video: null as WorldCupVideo | null, error: error.message };
  }

  const video = pickFeaturedWorldCupVideo(data ?? [], { matchId, homeTeam, awayTeam, now });
  return { video, error: null };
}

export function validateWorldCupVideoInput(input: WorldCupVideoInput) {
  const title = input.title.trim();
  if (!title) {
    return { valid: false as const, error: "Title is required." };
  }

  const youtubeId = extractYoutubeId(input.youtubeUrl);
  if (!youtubeId) {
    return { valid: false as const, error: "Enter a valid YouTube URL or video ID." };
  }

  if (!WORLD_CUP_VIDEO_CATEGORIES.includes(input.category)) {
    return { valid: false as const, error: "Choose a valid category." };
  }

  const priority = Number.isFinite(input.priority) ? Math.trunc(input.priority ?? 0) : 0;

  return {
    valid: true as const,
    value: {
      title,
      source_label: input.sourceLabel?.trim() || null,
      youtube_id: youtubeId,
      category: input.category,
      related_match_id: input.relatedMatchId?.trim() || null,
      related_team: input.relatedTeam?.trim() || null,
      starts_showing_at: input.startsShowingAt || null,
      expires_at: input.expiresAt || null,
      priority,
      is_active: input.isActive ?? true,
    },
  };
}

export async function createWorldCupVideo(admin: AdminClient, input: WorldCupVideoInput) {
  const validated = validateWorldCupVideoInput(input);
  if (!validated.valid) {
    return { video: null as WorldCupVideo | null, error: validated.error };
  }

  const { data, error } = await admin.from("world_cup_videos").insert(validated.value).select("*").single();

  if (error) {
    return { video: null, error: error.message };
  }

  return { video: mapRow(data), error: null };
}

export async function updateWorldCupVideoActive(admin: AdminClient, id: string, isActive: boolean) {
  const { data, error } = await admin
    .from("world_cup_videos")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { video: null as WorldCupVideo | null, error: error.message };
  }

  return { video: mapRow(data), error: null };
}
