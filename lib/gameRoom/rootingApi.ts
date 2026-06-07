import { getOrCreateVoterKey } from "@/lib/gameRoom/voterKey";
import { emptyRootingState, type RootingSide, type RootingState } from "@/lib/gameRoom/rooting";

type RootingResponse = RootingState & { error?: string };

function buildRootingQuery(gameId: string, roomCode: string | null, voterKey: string) {
  const params = new URLSearchParams({ gameId, voterKey });
  if (roomCode) {
    params.set("roomCode", roomCode);
  }

  return params.toString();
}

export async function fetchRootingState(gameId: string, roomCode: string | null): Promise<RootingState> {
  const voterKey = getOrCreateVoterKey();
  if (!voterKey) {
    return emptyRootingState();
  }

  const response = await fetch(`/api/game-room/rooting?${buildRootingQuery(gameId, roomCode, voterKey)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return emptyRootingState();
  }

  const payload = (await response.json()) as RootingResponse;
  return {
    homeCount: Math.max(0, Number(payload.homeCount) || 0),
    awayCount: Math.max(0, Number(payload.awayCount) || 0),
    choice: payload.choice === "home" || payload.choice === "away" ? payload.choice : null,
  };
}

export async function submitRootingVote(
  gameId: string,
  roomCode: string | null,
  teamKey: RootingSide,
): Promise<{ state: RootingState | null; error: string | null }> {
  const voterKey = getOrCreateVoterKey();
  if (!voterKey) {
    return { state: null, error: "Unable to save your vote." };
  }

  const response = await fetch("/api/game-room/rooting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, roomCode, voterKey, teamKey }),
  });

  const payload = (await response.json().catch(() => null)) as RootingResponse | { error?: string } | null;

  if (!response.ok) {
    return { state: null, error: payload && "error" in payload ? String(payload.error) : "Unable to save your vote." };
  }

  return {
    state: {
      homeCount: Math.max(0, Number((payload as RootingResponse).homeCount) || 0),
      awayCount: Math.max(0, Number((payload as RootingResponse).awayCount) || 0),
      choice:
        (payload as RootingResponse).choice === "home" || (payload as RootingResponse).choice === "away"
          ? (payload as RootingResponse).choice
          : null,
    },
    error: null,
  };
}

export async function validatePrivateRoom(gameId: string, roomCode: string) {
  const params = new URLSearchParams({ gameId, roomCode });
  const response = await fetch(`/api/game-room/private?${params.toString()}`, { method: "GET", cache: "no-store" });
  return response.ok;
}

export async function createPrivateRoom(gameId: string) {
  const response = await fetch("/api/game-room/private", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { roomCode?: string; invitePath?: string; inviteUrl?: string; error?: string }
    | null;

  if (!response.ok || !payload?.roomCode || !payload.invitePath) {
    const apiError = payload && typeof payload.error === "string" ? payload.error.trim() : "";
    return {
      error: apiError || `Unable to create a private room right now. (HTTP ${response.status})`,
      roomCode: null as string | null,
      invitePath: null as string | null,
      inviteUrl: null as string | null,
    };
  }

  return {
    error: null,
    roomCode: payload.roomCode,
    invitePath: payload.invitePath,
    inviteUrl: payload.inviteUrl ?? null,
  };
}
