import { LocktApp } from "@/components/LocktApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function PrivateGameRoomPage({
  params,
}: {
  params: Promise<{ gameId: string; roomCode: string }>;
}) {
  const { gameId, roomCode } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return <LocktApp initialView="live-arena" initialGameId={gameId} initialRoomCode={roomCode} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LocktApp initialView="live-arena" initialGameId={gameId} initialRoomCode={roomCode} />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return (
    <LocktApp profile={profile} initialView="live-arena" initialGameId={gameId} initialRoomCode={roomCode} />
  );
}
