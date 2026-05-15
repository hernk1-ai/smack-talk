"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { LiveArena } from "@/components/LiveArena";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ReceiptsScreen, type ReceiptOwner } from "@/components/screens/ReceiptsScreen";
import { TopTalkersScreen } from "@/components/screens/TopTalkersScreen";
import { ACTIVE_GAME_ID } from "@/lib/supabase/games";
import type { Profile } from "@/lib/supabase/types";

export function SmackTalkApp({
  profile,
  initialView = "arena",
  receiptOwner,
  initialGameId = ACTIVE_GAME_ID,
}: {
  profile?: Profile | null;
  initialView?: AppView;
  receiptOwner?: ReceiptOwner | null;
  initialGameId?: string;
}) {
  const router = useRouter();
  const [appView, setAppView] = useState<AppView>(initialView);
  const [activeGameRoomId, setActiveGameRoomId] = useState(initialGameId);

  const goToArena = () => setAppView("arena");
  const joinLive = (gameId = ACTIVE_GAME_ID) => {
    setActiveGameRoomId(gameId);
    setAppView("live-arena");
  };
  const selectBottomNav = (view: "arena" | "receipts" | "top-talkers" | "settings") => {
    if (view === "arena") {
      router.push("/app");
      setAppView("arena");
      return;
    }

    if (view === "receipts") {
      router.push("/receipts");
      setAppView("receipts");
      return;
    }

    if (view === "top-talkers") {
      router.push("/top-talkers");
      setAppView("top-talkers");
      return;
    }

    if (view === "settings") {
      router.push("/settings");
      return;
    }
  };

  return (
    <>
      {appView === "live-arena" ? (
        <LiveArena gameId={activeGameRoomId} onBack={goToArena} />
      ) : appView === "arena" ? (
        <ArenaView onJoinLive={joinLive} profile={profile} />
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

function ArenaView({ onJoinLive, profile }: { onJoinLive: (gameId?: string) => void; profile?: Profile | null }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <FeedScreen onEnterArena={onJoinLive} profile={profile} />
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
