import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;
type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

/** Only World Cup rows are ever read or written by these tools. */
export const WORLD_CUP_LEAGUE = "World Cup";

/** Matches the games_status_check constraint in the database. */
export const ADMIN_GAME_STATUSES = ["scheduled", "live", "final"] as const;
export type AdminGameStatus = (typeof ADMIN_GAME_STATUSES)[number];

export const MIN_SCORE = 0;
export const MAX_SCORE = 99;

const GAME_ID_PATTERN = /^[a-z0-9-]{1,64}$/i;

/** The only columns this tool ever exposes or mutates. */
const GAME_COLUMNS = "id, home_team, away_team, home_score, away_score, status, updated_at";

export type AdminGameRow = {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status: string;
  updated_at: string;
};

export type GameUpdateInput = {
  homeScore?: number;
  awayScore?: number;
  status?: AdminGameStatus;
};

export function validateGameId(value: unknown): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof value !== "string" || !GAME_ID_PATTERN.test(value)) {
    return { valid: false, error: "A valid game id is required." };
  }
  return { valid: true, value };
}

function validateScore(value: unknown): { valid: true; value: number } | { valid: false; error: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value < MIN_SCORE || value > MAX_SCORE) {
    return { valid: false, error: `Scores must be whole numbers between ${MIN_SCORE} and ${MAX_SCORE}.` };
  }
  return { valid: true, value };
}

function isAdminGameStatus(value: unknown): value is AdminGameStatus {
  return typeof value === "string" && (ADMIN_GAME_STATUSES as readonly string[]).includes(value);
}

/**
 * Validate an update payload. Each field is optional, but at least one must be
 * present. Anything outside home_score / away_score / status is ignored.
 */
export function validateGameUpdate(
  body: unknown,
): { valid: true; value: GameUpdateInput } | { valid: false; error: string } {
  const input = (body ?? {}) as Record<string, unknown>;
  const update: GameUpdateInput = {};

  if (input.homeScore !== undefined) {
    const check = validateScore(input.homeScore);
    if (!check.valid) {
      return { valid: false, error: check.error };
    }
    update.homeScore = check.value;
  }

  if (input.awayScore !== undefined) {
    const check = validateScore(input.awayScore);
    if (!check.valid) {
      return { valid: false, error: check.error };
    }
    update.awayScore = check.value;
  }

  if (input.status !== undefined) {
    if (!isAdminGameStatus(input.status)) {
      return { valid: false, error: `Status must be one of: ${ADMIN_GAME_STATUSES.join(", ")}.` };
    }
    update.status = input.status;
  }

  if (update.homeScore === undefined && update.awayScore === undefined && update.status === undefined) {
    return { valid: false, error: "Provide at least one of home_score, away_score, or status." };
  }

  return { valid: true, value: update };
}

/** List all World Cup games for the control panel. */
export async function listWorldCupGames(
  admin: AdminClient,
): Promise<{ error: string | null; games: AdminGameRow[] }> {
  const { data, error } = await admin
    .from("games")
    .select(GAME_COLUMNS)
    .eq("league", WORLD_CUP_LEAGUE)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) {
    return { error: error.message, games: [] };
  }

  return { error: null, games: (data ?? []) as AdminGameRow[] };
}

/**
 * Update a single World Cup game. Scoped by id AND league so a non-World-Cup
 * row can never be touched, and only the whitelisted columns are written.
 */
export async function updateWorldCupGame(
  admin: AdminClient,
  id: string,
  update: GameUpdateInput,
): Promise<{ error: string | null; game: AdminGameRow | null }> {
  const patch: GameUpdate = { updated_at: new Date().toISOString() };

  if (update.homeScore !== undefined) {
    patch.home_score = update.homeScore;
  }
  if (update.awayScore !== undefined) {
    patch.away_score = update.awayScore;
  }
  if (update.status !== undefined) {
    patch.status = update.status;
  }

  const { data, error } = await admin
    .from("games")
    .update(patch)
    .eq("id", id)
    .eq("league", WORLD_CUP_LEAGUE)
    .select(GAME_COLUMNS)
    .maybeSingle();

  if (error) {
    return { error: error.message, game: null };
  }

  return { error: null, game: (data as AdminGameRow | null) ?? null };
}
