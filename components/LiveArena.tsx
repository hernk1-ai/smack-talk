"use client";

import { useState } from "react";
import { ArenaChat } from "@/components/ArenaChat";
import { WhoIsCooking } from "@/components/WhoIsCooking";
import { topArenaTakes } from "@/utils/arenaChat";

type ArenaTab = "game" | "chat" | "calls";
type ArenaAction = "ride" | "draw" | "fade";

export function LiveArena({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<ArenaTab>("chat");
  const [lockedAction, setLockedAction] = useState<ArenaAction>();

  return (
    <main className="min-h-screen bg-black px-4 py-5 text-white">
      <div className="mx-auto max-w-md pb-8">
        <header className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="rounded-full border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-black text-gray-200 transition active:scale-95"
          >
            ← Feed
          </button>

          <div className="text-right">
            <p className="text-sm font-black">Smack Talk</p>
            <p className="text-xs text-gray-500">Live Arena</p>
          </div>
        </header>

        <section className="rounded-3xl border border-gray-800 bg-gray-950 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black">🏀 NBA Playoffs ▼</p>
            <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-200">
              LIVE · 3:42
            </span>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">LAL</p>
              <p className="text-4xl font-black">102</p>
            </div>
            <p className="pb-2 text-xs font-black text-gray-500">—</p>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-gray-500">GSW</p>
              <p className="text-4xl font-black">99</p>
            </div>
          </div>

          <p className="mt-2 text-center text-xs font-black uppercase text-gray-400">LIVE · 4th QTR · 3:42</p>

          <div className="mt-5 rounded-2xl bg-black p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-black">
              <span className="text-green-300">78% Riding LAL</span>
              <span className="text-indigo-200">22% Fading GSW</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-900">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-green-400 to-teal-300" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <ArenaActionButton
              active={lockedAction === "ride"}
              label="Ride LAL"
              tone="ride"
              onClick={() => setLockedAction("ride")}
            />
            <ArenaActionButton
              active={lockedAction === "draw"}
              label="Draw"
              tone="draw"
              onClick={() => setLockedAction("draw")}
            />
            <ArenaActionButton
              active={lockedAction === "fade"}
              label="Fade GSW"
              tone="fade"
              onClick={() => setLockedAction("fade")}
            />
          </div>

          {lockedAction && (
            <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-black">
              Locked. No switching sides.
            </p>
          )}

          <div className="mt-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3">
            <p className="text-sm font-black text-purple-100">Public is leaning heavy on LAL.</p>
            <button
              onClick={() => setLockedAction("fade")}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 py-2 text-xs font-black text-white transition active:scale-95"
            >
              Fade the Public
            </button>
          </div>
        </section>

        <nav className="mt-4 grid grid-cols-3 rounded-2xl border border-gray-800 bg-gray-950 p-1">
          {(["game", "chat", "calls"] as ArenaTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl py-2 text-xs font-black capitalize transition ${
                activeTab === tab ? "bg-white text-black" : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="mt-4 space-y-4">
          {activeTab === "chat" && (
            <>
              <WhoIsCooking />
              <ArenaChat />
            </>
          )}

          {activeTab === "game" && <GameTab />}

          {activeTab === "calls" && <CallsTab />}
        </div>
      </div>
    </main>
  );
}

function ArenaActionButton({
  active,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  tone: "ride" | "draw" | "fade";
  onClick: () => void;
}) {
  const toneClass = {
    ride: active ? "bg-green-300 text-black" : "bg-green-600 text-white",
    draw: active ? "bg-white text-black" : "bg-gray-900 text-white",
    fade: active
      ? "bg-gradient-to-r from-purple-300 to-indigo-300 text-black"
      : "bg-gradient-to-r from-purple-700 to-indigo-700 text-white",
  }[tone];

  return (
    <button onClick={onClick} className={`rounded-2xl py-3 text-xs font-black transition active:scale-95 ${toneClass}`}>
      {label}
    </button>
  );
}

function GameTab() {
  return (
    <>
      <WhoIsCooking />

      <section className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
        <h3 className="text-sm font-black">Live Momentum</h3>
        <p className="mt-1 text-xs text-gray-400">Momentum shifting toward LAL</p>

        <div className="mt-4 space-y-3">
          {["18’ LAL Goal", "42’ GSW Answer", "57’ LAL Run", "4th QTR Crowd pressure spikes"].map((event) => (
            <div key={event} className="flex items-center gap-3 rounded-xl bg-black p-3">
              <span className="h-2 w-2 rounded-full bg-green-300" />
              <p className="text-sm font-bold text-gray-200">{event}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function CallsTab() {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
      <h3 className="text-sm font-black">Top Takes</h3>

      <div className="mt-4 space-y-3">
        {topArenaTakes.map((take) => (
          <article key={take.handle} className="rounded-2xl bg-black p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black">{take.handle}</p>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-black ${
                  take.tone === "ride"
                    ? "bg-green-400 text-black"
                    : take.tone === "fade"
                      ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white"
                      : "bg-gray-800 text-gray-200"
                }`}
              >
                {take.action}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-200">“{take.text}”</p>
          </article>
        ))}
      </div>
    </section>
  );
}
