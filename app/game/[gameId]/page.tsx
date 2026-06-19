import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GameRoomServerPreview } from "@/components/game-room/GameRoomServerPreview";
import { LocktApp } from "@/components/LocktApp";
import { buildGameRoomPageMetadata, resolveGameRoomPageData } from "@/lib/seo/gameRoomPage";
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
  const pageData = await resolveGameRoomPageData(gameId);

  if (!pageData) {
    notFound();
  }

  const supabase = await createClient();

  if (!supabase) {
    return (
      <>
        <GameRoomServerPreview data={pageData} />
        <LocktApp initialView="live-arena" initialGameId={gameId} />
      </>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <GameRoomServerPreview data={pageData} />
        <LocktApp initialView="live-arena" initialGameId={gameId} />
      </>
    );
  }

  const { profile } = await ensureProfile(supabase, user);

  return (
    <>
      <GameRoomServerPreview data={pageData} />
      <LocktApp profile={profile} initialView="live-arena" initialGameId={gameId} />
    </>
  );
}
