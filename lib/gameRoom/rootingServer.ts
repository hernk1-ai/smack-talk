import type { SupabaseClient } from "@supabase/supabase-js";

import type { RootingSide, RootingState } from "@/lib/gameRoom/rooting";
import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

function scopeQuery(admin: AdminClient, gameId: string, roomCode: string | null) {
  let query = admin.from("match_rooting_votes").select("team_key").eq("game_id", gameId);

  if (roomCode) {
    query = query.eq("room_code", roomCode);
  } else {
    query = query.is("room_code", null);
  }

  return query;
}

export async function getRootingCounts(admin: AdminClient, gameId: string, roomCode: string | null) {
  const { data, error } = await scopeQuery(admin, gameId, roomCode);

  if (error) {
    return { error: error.message, counts: null as { homeCount: number; awayCount: number } | null };
  }

  const rows = data ?? [];
  return {
    error: null,
    counts: {
      homeCount: rows.filter((row) => row.team_key === "home").length,
      awayCount: rows.filter((row) => row.team_key === "away").length,
    },
  };
}

export async function getRootingChoice(
  admin: AdminClient,
  gameId: string,
  roomCode: string | null,
  voterKey: string,
) {
  let query = admin.from("match_rooting_votes").select("team_key").eq("game_id", gameId).eq("voter_key", voterKey);

  if (roomCode) {
    query = query.eq("room_code", roomCode);
  } else {
    query = query.is("room_code", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return { error: error.message, choice: null as RootingSide | null };
  }

  const teamKey = data?.team_key;
  const choice: RootingSide | null = teamKey === "home" || teamKey === "away" ? teamKey : null;
  return { error: null, choice };
}

export async function loadRootingState(
  admin: AdminClient,
  gameId: string,
  roomCode: string | null,
  voterKey?: string | null,
): Promise<{ error: string | null; state: RootingState | null }> {
  const [{ error: countsError, counts }, choiceResult] = await Promise.all([
    getRootingCounts(admin, gameId, roomCode),
    voterKey ? getRootingChoice(admin, gameId, roomCode, voterKey) : Promise.resolve({ error: null, choice: null }),
  ]);

  if (countsError || !counts) {
    return { error: countsError ?? "Unable to load rooting counts.", state: null };
  }

  if (choiceResult.error) {
    return { error: choiceResult.error, state: null };
  }

  return {
    error: null,
    state: {
      ...counts,
      choice: choiceResult.choice,
    },
  };
}

export async function upsertRootingVote(
  admin: AdminClient,
  {
    gameId,
    roomCode,
    voterKey,
    teamKey,
  }: {
    gameId: string;
    roomCode: string | null;
    voterKey: string;
    teamKey: RootingSide;
  },
) {
  let existingQuery = admin.from("match_rooting_votes").select("id").eq("game_id", gameId).eq("voter_key", voterKey);

  if (roomCode) {
    existingQuery = existingQuery.eq("room_code", roomCode);
  } else {
    existingQuery = existingQuery.is("room_code", null);
  }

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) {
    return { error: existingError.message, state: null as RootingState | null };
  }

  if (existing?.id) {
    const { error: updateError } = await admin
      .from("match_rooting_votes")
      .update({ team_key: teamKey })
      .eq("id", existing.id);

    if (updateError) {
      return { error: updateError.message, state: null };
    }
  } else {
    const { error: insertError } = await admin.from("match_rooting_votes").insert({
      game_id: gameId,
      room_code: roomCode,
      voter_key: voterKey,
      team_key: teamKey,
    });

    if (insertError) {
      return { error: insertError.message, state: null };
    }
  }

  return loadRootingState(admin, gameId, roomCode, voterKey);
}

export async function getPrivateRoom(admin: AdminClient, gameId: string, roomCode: string) {
  const { data, error } = await admin
    .from("private_match_rooms")
    .select("id, game_id, room_code, created_at")
    .eq("game_id", gameId)
    .eq("room_code", roomCode)
    .maybeSingle();

  if (error) {
    return { error: error.message, room: null };
  }

  return { error: null, room: data };
}

export async function createPrivateRoom(admin: AdminClient, gameId: string, roomCode: string) {
  const { data, error } = await admin
    .from("private_match_rooms")
    .insert({ game_id: gameId, room_code: roomCode })
    .select("room_code")
    .single();

  if (error) {
    return {
      error: error.message,
      errorCode: error.code ?? null,
      errorDetails: error.details ?? null,
      errorHint: error.hint ?? null,
      roomCode: null as string | null,
    };
  }

  return {
    error: null,
    errorCode: null,
    errorDetails: null,
    errorHint: null,
    roomCode: data.room_code,
  };
}
