import { LocktApp } from "@/components/LocktApp";
import { fetchResolvedMatchContextInput } from "@/lib/worldCup/fetchResolvedMatchContext";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function PrivateGameRoomPage({
  params,
}: {
  params: Promise<{ gameId: string; roomCode: string }>;
}) {
  const { gameId, roomCode } = await params;
  const matchContext = await fetchResolvedMatchContextInput();
  const supabase = await createClient();

  if (!supabase) {
    return (
      <LocktApp
        initialView="live-arena"
        initialGameId={gameId}
        initialRoomCode={roomCode}
        matchContext={matchContext}
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <LocktApp
        initialView="live-arena"
        initialGameId={gameId}
        initialRoomCode={roomCode}
        matchContext={matchContext}
      />
    );
  }

  const { profile } = await ensureProfile(supabase, user);

  return (
    <LocktApp
      profile={profile}
      initialView="live-arena"
      initialGameId={gameId}
      initialRoomCode={roomCode}
      matchContext={matchContext}
    />
  );
}
