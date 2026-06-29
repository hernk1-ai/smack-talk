"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { LiveArena } from "@/components/LiveArena";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ReceiptsScreen, type ReceiptOwner } from "@/components/screens/ReceiptsScreen";
import { TopTalkersScreen } from "@/components/screens/TopTalkersScreen";
import { getWorldCupMatchId } from "@/data/worldCupSchedule";
import { ACTIVE_GAME_ID } from "@/lib/supabase/games";
import { resolveGameRoomNavTargetClient } from "@/lib/worldCupNavClient";
import type { KnockoutResolutionData } from "@/lib/worldCup/knockoutMatchResolver";
import type { Profile } from "@/lib/supabase/types";

export function LocktApp({
  profile,
  initialView = "arena",
  receiptOwner,
  initialGameId = ACTIVE_GAME_ID,
  initialRoomCode = null,
  knockoutResolution,
}: {
  profile?: Profile | null;
  initialView?: AppView;
  receiptOwner?: ReceiptOwner | null;
  initialGameId?: string;
  initialRoomCode?: string | null;
  knockoutResolution?: KnockoutResolutionData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [appView, setAppView] = useState<AppView>(initialView);
  const [activeGameRoomId, setActiveGameRoomId] = useState(initialGameId);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(initialRoomCode);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, appView]);

  const goToArena = () => {
    router.push("/app");
    setAppView("arena");
  };

  const joinLive = (gameId = ACTIVE_GAME_ID) => {
    setActiveGameRoomId(gameId);
    setActiveRoomCode(null);
    setAppView("live-arena");
    router.push(`/game/${gameId}`);
  };
  const selectBottomNav = (view: "match-hub" | "schedule" | "standings" | "game-room" | "profile") => {
    if (view === "match-hub") {
      router.push("/app");
      setAppView("arena");
      return;
    }

    if (view === "profile") {
      router.push("/settings");
      setAppView("profile");
      return;
    }

    if (view === "schedule") {
      router.push("/schedule");
      return;
    }

    if (view === "standings") {
      router.push("/standings");
      return;
    }

    if (view === "game-room") {
      void resolveGameRoomNavTargetClient().then((target) => {
        const gameId = target.game?.id ?? (target.match ? getWorldCupMatchId(target.match) : null);
        if (gameId) {
          setActiveGameRoomId(gameId);
          setActiveRoomCode(null);
          setAppView("live-arena");
          router.push(target.href);
          return;
        }

        router.push(target.href);
      });
      return;
    }
  };

  return (
    <>
      {appView === "live-arena" ? (
        <LiveArena
          gameId={activeGameRoomId}
          roomCode={activeRoomCode}
          profile={profile}
          knockoutResolution={knockoutResolution}
          onBack={goToArena}
        />
      ) : appView === "arena" ? (
        <ArenaView onJoinLive={joinLive} profile={profile} knockoutResolution={knockoutResolution} />
      ) : appView === "receipts" ? (
        <ReceiptsView profile={profile} receiptOwner={receiptOwner} />
      ) : appView === "top-talkers" ? (
        <TopTalkersView profile={profile} />
      ) : appView === "profile" ? (
        <ProfileView profile={profile} />
      ) : (
        null
      )}

      <BottomNav activeView={appView} onSelect={selectBottomNav} />
    </>
  );
}

function ArenaView({
  onJoinLive,
  profile,
  knockoutResolution,
}: {
  onJoinLive: (gameId?: string) => void;
  profile?: Profile | null;
  knockoutResolution?: KnockoutResolutionData;
}) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <FeedScreen onEnterArena={onJoinLive} profile={profile} knockoutResolution={knockoutResolution} />
      </div>
    </main>
  );
}

function ReceiptsView({ profile, receiptOwner }: { profile?: Profile | null; receiptOwner?: ReceiptOwner | null }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <ReceiptsScreen profile={profile} recordOwner={receiptOwner} />
      </div>
    </main>
  );
}

function TopTalkersView({ profile }: { profile?: Profile | null }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <TopTalkersScreen profile={profile} />
      </div>
    </main>
  );
}

function ProfileView({ profile }: { profile?: Profile | null }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <ProfileScreen profile={profile} />
      </div>
    </main>
  );
}
