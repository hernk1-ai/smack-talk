import type { SupabaseClient } from "@supabase/supabase-js";

import { isWithinChatEditWindow } from "@/lib/gameRoom/chatValidation";
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
  editedAt: string | null;
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
    editedAt: row.edited_at,
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

function messageOwnedByCaller(
  row: Database["public"]["Tables"]["match_room_messages"]["Row"],
  {
    senderKey,
    userId,
  }: {
    senderKey: string;
    userId: string | null;
  },
) {
  if (row.user_id) {
    return Boolean(userId && row.user_id === userId);
  }

  return row.sender_key === senderKey;
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
    userId = null,
  }: {
    gameId: string;
    roomCode: string | null;
    senderKey: string;
    displayName: string | null;
    messageText: string;
    userId?: string | null;
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
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message, message: null as MatchRoomMessage | null };
  }

  return { error: null, message: mapMessage(data) };
}

export async function updateMatchRoomMessage(
  admin: AdminClient,
  {
    messageId,
    messageText,
    senderKey,
    userId = null,
    now = new Date(),
  }: {
    messageId: string;
    messageText: string;
    senderKey: string;
    userId?: string | null;
    now?: Date;
  },
) {
  const { data: row, error: fetchError } = await admin
    .from("match_room_messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message, message: null as MatchRoomMessage | null };
  }

  if (!row) {
    return { error: "Message not found.", message: null as MatchRoomMessage | null };
  }

  if (!messageOwnedByCaller(row, { senderKey, userId })) {
    return { error: "You can only edit your own messages.", message: null as MatchRoomMessage | null };
  }

  if (!isWithinChatEditWindow(row.created_at, now.getTime())) {
    return { error: "This message can no longer be edited.", message: null as MatchRoomMessage | null };
  }

  const { data, error } = await admin
    .from("match_room_messages")
    .update({
      message_text: messageText,
      edited_at: now.toISOString(),
    })
    .eq("id", messageId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message, message: null as MatchRoomMessage | null };
  }

  return { error: null, message: mapMessage(data) };
}
