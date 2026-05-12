"use client";

import { useState } from "react";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { LiveArena } from "@/components/LiveArena";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ReceiptsScreen } from "@/components/screens/ReceiptsScreen";
import { TopTalkersScreen } from "@/components/screens/TopTalkersScreen";
import type { Profile } from "@/lib/supabase/types";

export function SmackTalkApp({ profile }: { profile?: Profile | null }) {
  const [appView, setAppView] = useState<AppView>("arena");

  const goToArena = () => setAppView("arena");
  const joinLive = () => setAppView("live-arena");

  return (
    <>
      {appView === "live-arena" ? (
        <LiveArena onBack={goToArena} />
      ) : appView === "arena" ? (
        <ArenaView onJoinLive={joinLive} />
      ) : appView === "receipts" ? (
        <ReceiptsView />
      ) : appView === "top-talkers" ? (
        <TopTalkersView />
      ) : appView === "profile" ? (
        <ProfileView profile={profile} />
      ) : (
        null
      )}

      <BottomNav activeView={appView} onSelect={setAppView} />
    </>
  );
}

function ArenaView({ onJoinLive }: { onJoinLive: () => void }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <FeedScreen onEnterArena={onJoinLive} />
      </div>
    </main>
  );
}

function ReceiptsView() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <ReceiptsScreen />
      </div>
    </main>
  );
}

function TopTalkersView() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <TopTalkersScreen />
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
