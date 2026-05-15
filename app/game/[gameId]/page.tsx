import { SmackTalkApp } from "@/components/SmackTalkApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function GameRoomPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return <SmackTalkApp initialView="live-arena" initialGameId={gameId} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SmackTalkApp initialView="live-arena" initialGameId={gameId} />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <SmackTalkApp profile={profile} initialView="live-arena" initialGameId={gameId} />;
}
