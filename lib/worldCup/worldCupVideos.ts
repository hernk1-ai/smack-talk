import type { SupabaseClient } from "@supabase/supabase-js";

import { getWorldCupKickoffIso, getWorldCupMatchById } from "@/data/worldCupSchedule";
import type { Database } from "@/lib/supabase/types";
import {
  resolveWorldCupMatchPhase,
  WORLD_CUP_VIDEO_MATCH_PHASES,
  type WorldCupMatchPhase,
  type WorldCupVideoMatchPhase,
} from "@/lib/worldCup/matchPhase";
import { extractYoutubeId } from "@/lib/worldCup/youtube";

type AdminClient = SupabaseClient<Database>;
type WorldCupVideoRow = Database["public"]["Tables"]["world_cup_videos"]["Row"];

export const WORLD_CUP_VIDEO_CATEGORIES = [
  "preview",
  "highlight",
  "press_conference",
  "injury",
  "news",
  "fan_video",
  "general",
] as const;

export type WorldCupVideoCategory = (typeof WORLD_CUP_VIDEO_CATEGORIES)[number];

export const WORLD_CUP_VIDEO_CATEGORY_OPTIONS = [
  { value: "preview", label: "Preview" },
  { value: "highlight", label: "Highlight" },
  { value: "press_conference", label: "Press conference" },
  { value: "injury", label: "Injury report" },
  { value: "news", label: "Tournament news" },
  { value: "fan_video", label: "Fan video" },
  { value: "general", label: "General" },
] as const;

export const WORLD_CUP_VIDEO_CATEGORY_LABELS: Record<WorldCupVideoCategory, string> = {
  preview: "Preview",
  highlight: "Highlight",
  press_conference: "Press Conference",
  injury: "Injury Report",
  news: "Tournament News",
  fan_video: "Fan Video",
  general: "World Cup TV",
};

export const MATCH_HUB_NEWS_CATEGORIES = ["injury", "press_conference", "news", "general"] as const;

export type MatchHubNewsCategory = (typeof MATCH_HUB_NEWS_CATEGORIES)[number];

const MATCH_HUB_NEWS_CATEGORY_PRIORITY: Record<MatchHubNewsCategory, number> = {
  injury: 4,
  press_conference: 3,
  news: 2,
  general: 1,
};

const MATCH_HUB_PRESERVED_CATEGORIES = ["injury", "press_conference", "news"] as const;

export function resolveMatchHubNewsDeskCategory(category: WorldCupVideoCategory): WorldCupVideoCategory {
  if ((MATCH_HUB_PRESERVED_CATEGORIES as readonly string[]).includes(category)) {
    return category;
  }

  return "news";
}

export function isMatchHubNewsDeskEligible(video: WorldCupVideo): boolean {
  return (
    video.isActive &&
    (MATCH_HUB_NEWS_CATEGORIES as readonly string[]).includes(video.category) &&
    !video.relatedMatchId &&
    !video.relatedTeam &&
    video.matchPhase === "any"
  );
}

export type WorldCupVideo = {
  id: string;
  title: string;
  sourceLabel: string | null;
  youtubeId: string;
  category: WorldCupVideoCategory;
  relatedMatchId: string | null;
  relatedTeam: string | null;
  matchPhase: WorldCupVideoMatchPhase;
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
  matchPhase?: WorldCupVideoMatchPhase;
  startsShowingAt?: string | null;
  expiresAt?: string | null;
  priority?: number;
  isActive?: boolean;
};

export type WorldCupVideoUpdateInput = {
  id: string;
  title: string;
  sourceLabel?: string | null;
  youtubeUrl?: string;
  youtubeId?: string;
  category: WorldCupVideoCategory;
  relatedMatchId?: string | null;
  relatedTeam?: string | null;
  matchPhase?: WorldCupVideoMatchPhase;
  priority?: number;
  isActive?: boolean;
};

function resolveYoutubeId(youtubeUrl?: string, youtubeId?: string) {
  if (youtubeId?.trim()) {
    return extractYoutubeId(youtubeId.trim());
  }

  if (youtubeUrl?.trim()) {
    return extractYoutubeId(youtubeUrl);
  }

  return null;
}

function mapRow(row: WorldCupVideoRow): WorldCupVideo {
  return {
    id: row.id,
    title: row.title,
    sourceLabel: row.source_label,
    youtubeId: row.youtube_id,
    category: row.category as WorldCupVideoCategory,
    relatedMatchId: row.related_match_id,
    relatedTeam: row.related_team,
    matchPhase: (row.match_phase ?? "any") as WorldCupVideoMatchPhase,
    startsShowingAt: row.starts_showing_at,
    expiresAt: row.expires_at,
    priority: row.priority,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function isVisibleNow(row: WorldCupVideoRow, now: Date): boolean {
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
  row: WorldCupVideoRow,
  matchId: string,
  teams: string[],
  currentPhase: WorldCupMatchPhase,
): number {
  const videoPhase = (row.match_phase ?? "any") as WorldCupVideoMatchPhase;
  const phaseMatches = videoPhase === currentPhase;
  const phaseAny = videoPhase === "any";

  const isMatch = Boolean(row.related_match_id && row.related_match_id === matchId);
  const isTeam = Boolean(row.related_team && teams.includes(row.related_team));
  const isGeneral = !row.related_match_id && !row.related_team;

  if (phaseMatches) {
    if (isMatch) return 6;
    if (isTeam) return 5;
    if (isGeneral) return 4;
  }

  if (phaseAny) {
    if (isMatch) return 3;
    if (isTeam) return 2;
    if (isGeneral) return 1;
  }

  return 0;
}

export function pickFeaturedWorldCupVideo(
  rows: WorldCupVideoRow[],
  {
    matchId,
    homeTeam,
    awayTeam,
    matchPhase,
    now = new Date(),
  }: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    matchPhase: WorldCupMatchPhase;
    now?: Date;
  },
): WorldCupVideo | null {
  const teams = [homeTeam, awayTeam].filter(Boolean);

  const ranked = rows
    .filter((row) => isVisibleNow(row, now))
    .map((row) => ({ row, tier: selectionTier(row, matchId, teams, matchPhase) }))
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

function matchHubNewsCategoryTier(category: string): number {
  return MATCH_HUB_NEWS_CATEGORY_PRIORITY[category as MatchHubNewsCategory] ?? 0;
}

export function pickFeaturedMatchHubNewsVideo(
  rows: WorldCupVideoRow[],
  now = new Date(),
): WorldCupVideo | null {
  const ranked = rows
    .filter((row) => isVisibleNow(row, now))
    .map((row) => ({ row, tier: matchHubNewsCategoryTier(row.category) }))
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

export async function getFeaturedMatchHubNewsVideo(admin: AdminClient, now = new Date()) {
  const { data, error } = await admin.from("world_cup_videos").select("*").eq("is_active", true);

  if (error) {
    return { video: null as WorldCupVideo | null, error: error.message };
  }

  const video = pickFeaturedMatchHubNewsVideo(data ?? [], now);
  return { video, error: null };
}

export function resolveWorldCupVideoMatchContext(gameId: string) {
  const scheduleMatchId = gameId.match(/^wc-2026-(\d+)$/)?.[1];
  const scheduleMatch = scheduleMatchId ? getWorldCupMatchById(Number(scheduleMatchId)) : null;
  const startsAt = scheduleMatch ? getWorldCupKickoffIso(scheduleMatch) : null;

  return {
    matchId: gameId,
    homeTeam: scheduleMatch?.homeTeam ?? "HOME",
    awayTeam: scheduleMatch?.awayTeam ?? "AWAY",
    startsAt,
    status: null as string | null,
  };
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
    status,
    startsAt,
    now = new Date(),
  }: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    status?: string | null;
    startsAt?: string | null;
    now?: Date;
  },
) {
  const matchPhase = resolveWorldCupMatchPhase({ status, startsAt, now });

  const { data, error } = await admin.from("world_cup_videos").select("*").eq("is_active", true);

  if (error) {
    return { video: null as WorldCupVideo | null, matchPhase, error: error.message };
  }

  const video = pickFeaturedWorldCupVideo(data ?? [], {
    matchId,
    homeTeam,
    awayTeam,
    matchPhase,
    now,
  });

  return { video, matchPhase, error: null };
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

  const matchPhase = input.matchPhase ?? "any";
  if (!WORLD_CUP_VIDEO_MATCH_PHASES.includes(matchPhase)) {
    return { valid: false as const, error: "Choose a valid match phase." };
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
      match_phase: matchPhase,
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

export function validateWorldCupVideoUpdateInput(input: WorldCupVideoUpdateInput) {
  const id = input.id.trim();
  if (!id) {
    return { valid: false as const, error: "Video id is required." };
  }

  const title = input.title.trim();
  if (!title) {
    return { valid: false as const, error: "Title is required." };
  }

  const youtube_id = resolveYoutubeId(input.youtubeUrl, input.youtubeId);
  if (!youtube_id) {
    return { valid: false as const, error: "Enter a valid YouTube URL or video ID." };
  }

  if (!WORLD_CUP_VIDEO_CATEGORIES.includes(input.category)) {
    return { valid: false as const, error: "Choose a valid category." };
  }

  const matchPhase = input.matchPhase ?? "any";
  if (!WORLD_CUP_VIDEO_MATCH_PHASES.includes(matchPhase)) {
    return { valid: false as const, error: "Choose a valid match phase." };
  }

  const priority = Number.isFinite(input.priority) ? Math.trunc(input.priority ?? 0) : 0;

  return {
    valid: true as const,
    value: {
      title,
      source_label: input.sourceLabel?.trim() || null,
      youtube_id,
      category: input.category,
      related_match_id: input.relatedMatchId?.trim() || null,
      related_team: input.relatedTeam?.trim() || null,
      match_phase: matchPhase,
      priority,
      is_active: input.isActive ?? true,
    },
  };
}

export async function updateWorldCupVideo(admin: AdminClient, input: WorldCupVideoUpdateInput) {
  const validated = validateWorldCupVideoUpdateInput(input);
  if (!validated.valid) {
    return { video: null as WorldCupVideo | null, error: validated.error };
  }

  const { data, error } = await admin
    .from("world_cup_videos")
    .update(validated.value)
    .eq("id", input.id.trim())
    .select("*")
    .single();

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

export async function updateWorldCupVideoForMatchHub(admin: AdminClient, id: string) {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return { video: null as WorldCupVideo | null, error: "Video id is required." };
  }

  const { data: existing, error: fetchError } = await admin
    .from("world_cup_videos")
    .select("*")
    .eq("id", trimmedId)
    .single();

  if (fetchError || !existing) {
    return { video: null as WorldCupVideo | null, error: fetchError?.message ?? "Video not found." };
  }

  const category = resolveMatchHubNewsDeskCategory(existing.category as WorldCupVideoCategory);

  const { data, error } = await admin
    .from("world_cup_videos")
    .update({
      category,
      related_match_id: null,
      related_team: null,
      is_active: true,
      priority: 100,
      match_phase: "any",
    })
    .eq("id", trimmedId)
    .select("*")
    .single();

  if (error) {
    return { video: null as WorldCupVideo | null, error: error.message };
  }

  return { video: mapRow(data), error: null };
}

type SelectionCheck = { name: string; pass: boolean; detail: string };

function makeRow(
  overrides: Partial<WorldCupVideoRow> & Pick<WorldCupVideoRow, "id" | "title" | "youtube_id">,
): WorldCupVideoRow {
  return {
    source_label: null,
    category: "general",
    related_match_id: null,
    related_team: null,
    match_phase: "any",
    starts_showing_at: null,
    expires_at: null,
    priority: 0,
    is_active: true,
    created_at: "2026-06-12T12:00:00.000Z",
    ...overrides,
  };
}

/** Dev-safe checks for phase-aware video selection. */
export function validateWorldCupVideoSelection(): { ok: boolean; checks: SelectionCheck[] } {
  const matchId = "wc-2026-3";
  const homeTeam = "Canada";
  const awayTeam = "Bosnia and Herzegovina";
  const kickoff = "2026-06-12T21:00:00.000Z";
  const checks: SelectionCheck[] = [];

  const anyGeneral = makeRow({
    id: "any-general",
    title: "Any general",
    youtube_id: "anygeneral11",
    match_phase: "any",
    priority: 0,
  });

  const preMatchGeneral = makeRow({
    id: "pre-general",
    title: "Pre general",
    youtube_id: "pregeneral11",
    match_phase: "pre_match",
    priority: 0,
  });

  const liveGeneral = makeRow({
    id: "live-general",
    title: "Live general",
    youtube_id: "livegeneral1",
    match_phase: "live",
    priority: 0,
  });

  const postMatchGeneral = makeRow({
    id: "post-general",
    title: "Post general",
    youtube_id: "postgeneral1",
    match_phase: "post_match",
    priority: 0,
  });

  const beforeKickoff = pickFeaturedWorldCupVideo([anyGeneral, preMatchGeneral, liveGeneral], {
    matchId,
    homeTeam,
    awayTeam,
    matchPhase: "pre_match",
    now: new Date("2026-06-12T20:00:00.000Z"),
  });

  checks.push({
    name: "pre_match video before kickoff",
    pass: beforeKickoff?.id === "pre-general",
    detail: beforeKickoff?.title ?? "none",
  });

  const anyOnlyBeforeKickoff = pickFeaturedWorldCupVideo([anyGeneral], {
    matchId,
    homeTeam,
    awayTeam,
    matchPhase: "pre_match",
    now: new Date("2026-06-12T20:00:00.000Z"),
  });

  checks.push({
    name: "any video still appears",
    pass: anyOnlyBeforeKickoff?.id === "any-general",
    detail: anyOnlyBeforeKickoff?.title ?? "none",
  });

  const duringLive = pickFeaturedWorldCupVideo([anyGeneral, liveGeneral], {
    matchId,
    homeTeam,
    awayTeam,
    matchPhase: "live",
    now: new Date(kickoff),
  });

  checks.push({
    name: "live video beats any during live match",
    pass: duringLive?.id === "live-general",
    detail: duringLive?.title ?? "none",
  });

  const afterFinal = pickFeaturedWorldCupVideo([anyGeneral, postMatchGeneral], {
    matchId,
    homeTeam,
    awayTeam,
    matchPhase: "post_match",
    now: new Date("2026-06-13T02:00:00.000Z"),
  });

  checks.push({
    name: "post_match video beats any after final",
    pass: afterFinal?.id === "post-general",
    detail: afterFinal?.title ?? "none",
  });

  return { ok: checks.every((check) => check.pass), checks };
}

/** Dev-safe checks for Match Hub news desk video selection. */
export function validateMatchHubNewsSelection(): { ok: boolean; checks: SelectionCheck[] } {
  const checks: SelectionCheck[] = [];

  const injury = makeRow({
    id: "injury-1",
    title: "Injury report",
    youtube_id: "injuryvid11",
    category: "injury",
    priority: 0,
  });

  const general = makeRow({
    id: "general-1",
    title: "General news",
    youtube_id: "generalvid1",
    category: "general",
    priority: 100,
  });

  const injuryPick = pickFeaturedMatchHubNewsVideo([general, injury]);
  checks.push({
    name: "injury beats general on Match Hub",
    pass: injuryPick?.id === "injury-1",
    detail: injuryPick?.title ?? "none",
  });

  const generalOnly = pickFeaturedMatchHubNewsVideo([general]);
  checks.push({
    name: "general appears when no injury/news/press video",
    pass: generalOnly?.id === "general-1",
    detail: generalOnly?.title ?? "none",
  });

  const none = pickFeaturedMatchHubNewsVideo([
    makeRow({ id: "preview-1", title: "Preview", youtube_id: "previewvid1", category: "preview" }),
  ]);
  checks.push({
    name: "preview category excluded from Match Hub",
    pass: none === null,
    detail: none?.title ?? "none",
  });

  return { ok: checks.every((check) => check.pass), checks };
}
