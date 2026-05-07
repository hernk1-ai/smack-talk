"use client";

import { useState } from "react";
import { BottomNav, type AppView } from "@/components/BottomNav";
import { LiveArena } from "@/components/LiveArena";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { FeedScreen } from "@/components/screens/FeedScreen";

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
      ) : (
        <SimpleView activeView={appView} />
      )}

      <BottomNav activeView={appView} onSelect={setAppView} />
    </>
  );
}

function FeedView({ onEnterArena }: { onEnterArena: () => void }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <header className="mb-6 rounded-3xl border border-white/10 bg-black/35 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <SmackTalkLogo size={56} />
              <div>
                <h1 className="brand-lockup text-4xl leading-none">
                  <span className="text-white">Smack</span>{" "}
                  <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                    Talk
                  </span>
                </h1>
                <p className="mt-2 text-sm font-bold text-gray-400">Talk it. Lock it. Live with it.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase text-purple-200">Live</p>
              <p className="text-xs font-black text-white">Arena Ready</p>
            </div>
          </div>
        </header>

        <FeedScreen onEnterArena={onEnterArena} />
      </div>
    </main>
  );
}

function SimpleView({ activeView }: { activeView: Exclude<AppView, "feed" | "arena"> }) {
  const viewCopy = {
    receipts: {
      eyebrow: "Receipts",
      title: "Receipts",
      body: "Your locked calls and final results will live here.",
    },
    "top-talkers": {
      eyebrow: "Top Talkers",
      title: "Top Talkers",
      body: "The reputation board is warming up.",
    },
    profile: {
      eyebrow: "Profile",
      title: "@hernk1",
      body: "Stats, streaks, and your talker identity stay here.",
    },
  }[activeView];

  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom">
        <header className="mb-6 rounded-3xl border border-white/10 bg-black/35 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <SmackTalkLogo size={52} />
            <div>
              <h1 className="brand-lockup text-4xl leading-none">
                <span className="text-white">Smack</span>{" "}
                <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                  Talk
                </span>
              </h1>
              <p className="mt-2 text-sm font-bold text-gray-400">Talk it. Lock it. Live with it.</p>
            </div>
          </div>
        </header>

        <section className="premium-card rounded-[1.75rem] border border-white/10 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.36)]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">{viewCopy.eyebrow}</p>
          <h2 className="sports-display mt-3 text-4xl leading-none text-white">{viewCopy.title}</h2>
          <p className="mt-4 text-sm font-semibold leading-6 text-gray-400">{viewCopy.body}</p>
        </section>
      </div>
    </main>
  );
}
