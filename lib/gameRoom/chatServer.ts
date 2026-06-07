import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

export type MatchRoomMessage = {
  id: string;
  gameId: string;
  roomCode: string | null;
  senderKey: string;
  displayName: string | null;
  messageText: string;
  createdAt: string;
};

function mapMessage(row: Database["public"]["Tables"]["match_room_messages"]["Row"]): MatchRoomMessage {
  return {
    id: row.id,
    gameId: row.game_id,
    roomCode: row.room_code,
    senderKey: row.sender_key,
    displayName: row.display_name,
    messageText: row.message_text,
    createdAt: row.created_at,
  };
}

function scopeQuery(admin: AdminClient, gameId: string, roomCode: string | null) {
  let query = admin.from("match_room_messages").select("*").eq("game_id", gameId);

  if (roomCode) {
    query = query.eq("room_code", roomCode);
  } else {
    query = query.is("room_code", null);
  }

  return query;
}

export async function listMatchRoomMessages(
  admin: AdminClient,
  gameId: string,
  roomCode: string | null,
  limit = 50,
) {
  const { data, error } = await scopeQuery(admin, gameId, roomCode)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message, messages: null as MatchRoomMessage[] | null };
  }

  return {
    error: null,
    messages: (data ?? []).map(mapMessage),
  };
}

export async function createMatchRoomMessage(
  admin: AdminClient,
  {
    gameId,
    roomCode,
    senderKey,
    displayName,
    messageText,
  }: {
    gameId: string;
    roomCode: string | null;
    senderKey: string;
    displayName: string | null;
    messageText: string;
  },
) {
  const { data, error } = await admin
    .from("match_room_messages")
    .insert({
      game_id: gameId,
      room_code: roomCode,
      sender_key: senderKey,
      display_name: displayName,
      message_text: messageText,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message, message: null as MatchRoomMessage | null };
  }

  return { error: null, message: mapMessage(data) };
}
