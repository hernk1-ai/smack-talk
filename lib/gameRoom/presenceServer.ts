import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

/** A viewer counts as in the room if seen within this window. */
export const PRESENCE_ACTIVE_WINDOW_MS = 30 * 60 * 1000;

function scopeRoom<T extends { eq: (column: string, value: string) => T; is: (column: string, value: null) => T }>(
  query: T,
  roomCode: string | null,
): T {
  return roomCode ? query.eq("room_code", roomCode) : query.is("room_code", null);
}

/** Count distinct active viewers in a single public/private room scope. */
export async function getActiveViewerCount(
  admin: AdminClient,
  gameId: string,
  roomCode: string | null,
): Promise<{ error: string | null; count: number }> {
  const sinceIso = new Date(Date.now() - PRESENCE_ACTIVE_WINDOW_MS).toISOString();

  let query = admin
    .from("game_room_presence")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .gte("last_seen_at", sinceIso);

  query = scopeRoom(query, roomCode);

  const { count, error } = await query;

  if (error) {
    return { error: error.message, count: 0 };
  }

  return { error: null, count: count ?? 0 };
}

/**
 * Record a heartbeat for this viewer (upsert by scope) and return the active count.
 * Public rooms (roomCode null) and private rooms (roomCode set) are scoped separately.
 */
export async function heartbeatPresence(
  admin: AdminClient,
  {
    gameId,
    roomCode,
    viewerKey,
  }: {
    gameId: string;
    roomCode: string | null;
    viewerKey: string;
  },
): Promise<{ error: string | null; count: number }> {
  const nowIso = new Date().toISOString();

  let existingQuery = admin
    .from("game_room_presence")
    .select("id")
    .eq("game_id", gameId)
    .eq("viewer_key", viewerKey);

  existingQuery = scopeRoom(existingQuery, roomCode);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) {
    return { error: existingError.message, count: 0 };
  }

  if (existing?.id) {
    const { error: updateError } = await admin
      .from("game_room_presence")
      .update({ last_seen_at: nowIso })
      .eq("id", existing.id);

    if (updateError) {
      return { error: updateError.message, count: 0 };
    }
  } else {
    const { error: insertError } = await admin.from("game_room_presence").insert({
      game_id: gameId,
      room_code: roomCode,
      viewer_key: viewerKey,
      last_seen_at: nowIso,
    });

    // A concurrent heartbeat may insert first; the unique scope index makes that safe to ignore.
    if (insertError && insertError.code !== "23505") {
      return { error: insertError.message, count: 0 };
    }
  }

  return getActiveViewerCount(admin, gameId, roomCode);
}
