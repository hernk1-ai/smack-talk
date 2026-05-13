"use client";

import { useState } from "react";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { LiveArena } from "@/components/LiveArena";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ReceiptsScreen, type ReceiptOwner } from "@/components/screens/ReceiptsScreen";
import { TopTalkersScreen } from "@/components/screens/TopTalkersScreen";
import type { Profile } from "@/lib/supabase/types";

export function SmackTalkApp({
  profile,
  initialView = "arena",
  receiptOwner,
}: {
  profile?: Profile | null;
  initialView?: AppView;
  receiptOwner?: ReceiptOwner | null;
}) {
  const [appView, setAppView] = useState<AppView>(initialView);

  const goToArena = () => setAppView("arena");
  const joinLive = () => setAppView("live-arena");

  return (
    <>
      {appView === "live-arena" ? (
        <LiveArena onBack={goToArena} />
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

      <BottomNav activeView={appView} onSelect={setAppView} />
    </>
  );
}

function ArenaView({ onJoinLive, profile }: { onJoinLive: () => void; profile?: Profile | null }) {
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
