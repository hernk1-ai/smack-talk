/**
 * Client wrappers for server-validated Game Room mutations.
 * TODO(cloudflare): rate limits also configured at edge for these paths.
 */

async function parseResponse<T>(response: Response): Promise<{ data: T | null; error: string | null }> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    return { data: null, error: payload.error ?? "Request failed." };
  }

  return { data: payload as T, error: null };
}

export async function postGuestJoin(displayName: string) {
  const response = await fetch("/api/guest/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });

  return parseResponse<{ profile: unknown }>(response);
}

export async function postArenaCall(gameId: string, takeText: string) {
  const response = await fetch("/api/arena/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, takeText }),
  });

  return parseResponse<{ take: unknown; starterRepAwarded?: boolean }>(response);
}

export async function postArenaComment(takeId: string, replyText: string, parentReplyId?: string | null) {
  const response = await fetch("/api/arena/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ takeId, replyText, parentReplyId: parentReplyId ?? null }),
  });

  return parseResponse<{ reply: unknown }>(response);
}

export async function deleteArenaComment(replyId: string) {
  const response = await fetch(`/api/arena/comment?replyId=${encodeURIComponent(replyId)}`, {
    method: "DELETE",
  });

  return parseResponse<{ ok: boolean }>(response);
}

export async function postArenaReaction(takeId: string, reaction: "ride" | "fade") {
  const response = await fetch("/api/arena/reaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ takeId, reaction }),
  });

  return parseResponse<{ reaction: unknown; take: unknown }>(response);
}

export async function postArenaReport({
  targetType,
  targetId,
  reason,
  details,
}: {
  targetType: "take" | "reply" | "user";
  targetId: string;
  reason: string;
  details?: string;
}) {
  const response = await fetch("/api/arena/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetType, targetId, reason, details }),
  });

  return parseResponse<{ ok: boolean }>(response);
}
