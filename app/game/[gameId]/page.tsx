import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LocktApp } from "@/components/LocktApp";
import { buildGameRoomPageMetadata, resolveGameRoomPageData } from "@/lib/seo/gameRoomPage";
import { fetchResolvedMatchContextInput } from "@/lib/worldCup/fetchResolvedMatchContext";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  const pageData = await resolveGameRoomPageData(gameId);

  if (!pageData) {
    return {
      title: "Game Room Not Found | LOCKT",
      robots: { index: false, follow: false },
    };
  }

  return buildGameRoomPageMetadata(pageData);
}

export default async function GameRoomPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const [pageData, matchContext] = await Promise.all([
    resolveGameRoomPageData(gameId),
    fetchResolvedMatchContextInput(),
  ]);

  if (!pageData) {
    notFound();
  }

  const supabase = await createClient();

  if (!supabase) {
    return <LocktApp initialView="live-arena" initialGameId={gameId} matchContext={matchContext} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LocktApp initialView="live-arena" initialGameId={gameId} matchContext={matchContext} />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return (
    <LocktApp
      profile={profile}
      initialView="live-arena"
      initialGameId={gameId}
      matchContext={matchContext}
    />
  );
}
