"use client";

import { useState } from "react";
import { LiveArena } from "@/components/LiveArena";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { FeedScreen } from "@/components/screens/FeedScreen";

type AppView = "feed" | "arena";

export default function Home() {
  const [appView, setAppView] = useState<AppView>("feed");

  if (appView === "arena") {
    return <LiveArena onBack={() => setAppView("feed")} />;
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
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

        <FeedScreen onEnterArena={() => setAppView("arena")} />

        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#02040a]/95 px-4 py-3 shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[1.4rem] border border-white/10 bg-white/5 p-2 text-center text-[10px] font-black uppercase">
            <span className="rounded-2xl bg-white px-3 py-2 text-black">Feed</span>
            <span className="px-2 py-2 text-gray-500">Receipts</span>
            <span className="px-2 py-2 text-gray-500">Top Talkers</span>
            <span className="px-2 py-2 text-gray-500">Profile</span>
          </div>
        </nav>
      </div>
    </main>
  );
}
