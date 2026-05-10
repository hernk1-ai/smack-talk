"use client";

import { useState } from "react";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { LiveArena } from "@/components/LiveArena";
import { FeedScreen } from "@/components/screens/FeedScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ReceiptsScreen } from "@/components/screens/ReceiptsScreen";
import { TopTalkersScreen } from "@/components/screens/TopTalkersScreen";

export function SmackTalkApp() {
  const [appView, setAppView] = useState<AppView>("feed");

  const goToFeed = () => setAppView("feed");
  const goToArena = () => setAppView("arena");

  return (
    <>
      {appView === "arena" ? (
        <LiveArena onBack={goToFeed} />
      ) : appView === "feed" ? (
        <FeedView onEnterArena={goToArena} />
      ) : appView === "receipts" ? (
        <ReceiptsView />
      ) : appView === "top-talkers" ? (
        <TopTalkersView />
      ) : appView === "profile" ? (
        <ProfileView />
      ) : (
        null
      )}

      <BottomNav activeView={appView} onSelect={setAppView} />
    </>
  );
}

function FeedView({ onEnterArena }: { onEnterArena: () => void }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <FeedScreen onEnterArena={onEnterArena} />
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

function ProfileView() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <ProfileScreen />
      </div>
    </main>
  );
}
