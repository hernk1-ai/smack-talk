"use client";

import { useState } from "react";
import { ArenaChat } from "@/components/ArenaChat";
import { RunTheArena } from "@/components/RunTheArena";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { WhoIsCooking } from "@/components/WhoIsCooking";
import { topArenaTakes } from "@/utils/arenaChat";

type ArenaTab = "game" | "chat" | "calls";
type ArenaAction = "ride" | "draw" | "fade";

export function LiveArena({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<ArenaTab>("chat");
  const [lockedAction, setLockedAction] = useState<ArenaAction>();

  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white">
      <div className="arena-shell screen-safe-bottom">
        <header className="mb-4 border-b border-white/10 pb-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/50 text-sm font-black text-gray-200 shadow-[0_12px_30px_rgba(0,0,0,0.32)] transition active:scale-95"
                aria-label="Back to feed"
              >
                ←
              </button>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-9 w-9 rounded-full border border-white/10 bg-gradient-to-br from-slate-200 to-slate-600" />
                <div>
                  <p className="text-xs font-black text-purple-300">LVL 13</p>
                  <p className="text-[10px] font-bold text-gray-500">4,250 XP</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <SmackTalkLogo size={42} />
              <p className="brand-lockup text-2xl leading-none sm:text-3xl">
                <span>Smack</span>{" "}
                <span className="bg-gradient-to-r from-purple-300 to-sky-300 bg-clip-text text-transparent">Talk</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <div className="rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-right">
                <p className="text-xs font-black text-yellow-200">🔥 6</p>
                <p className="text-[10px] font-black uppercase text-gray-500">Streak</p>
              </div>
              <div className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/45 text-lg">
                ♢
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-purple-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="sports-display text-3xl leading-none">Live Arena</h1>
            <p className="mt-1 text-xs font-bold text-gray-500">
              <span className="text-green-300">●</span> 12,842 online
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-black">🏀 NBA Playoffs ▼</p>
            <span className="rounded-full border border-red-300/20 bg-red-500/15 px-3 py-2 text-[10px] font-black uppercase text-red-200">
              Live
            </span>
          </div>
        </div>

        <section className="scoreboard-shell arena-surface overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.48)] sm:p-7">
          <div className="scoreboard-inner arena-scoreboard rounded-[1.75rem] border border-white/10 px-5 py-6 shadow-inner sm:px-8 sm:py-8">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              NBA Playoffs · West Semifinals
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.12em]">
              <span className="rounded-md bg-purple-600 px-2.5 py-1 text-white">Live</span>
              <span className="text-gray-200">4th QTR · 3:24</span>
            </div>

            <div className="mx-auto mt-8 grid max-w-[880px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-8">
              <TeamScore city="Los Angeles" seed="#7 seed" team="LAL" score="102" side="left" />
              <div className="grid place-items-center">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-gray-400">
                  VS
                </span>
              </div>
              <TeamScore city="Golden State" seed="#6 seed" team="GSW" score="99" side="right" />
            </div>

            <div className="mt-7 text-center">
              <p className="inline-flex rounded-2xl border border-orange-300/15 bg-black/45 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-orange-200">
                🔥 Momentum: Lakers
              </p>
            </div>
          </div>

          <div className="scoreboard-inner mt-7 rounded-3xl border border-white/10 bg-black/55 p-5 sm:p-6">
            <div className="mb-5 grid grid-cols-2 gap-5">
              <div>
                <p className="scoreboard-number text-5xl text-green-300">78%</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Riding LAL</p>
              </div>
              <div className="text-right">
                <p className="scoreboard-number text-5xl text-indigo-200">22%</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Fading GSW</p>
              </div>
            </div>
            <div className="flex h-5 overflow-hidden rounded-full bg-gray-950 ring-1 ring-white/10">
              <div className="h-full w-[78%] bg-gradient-to-r from-green-400 to-teal-300" />
              <div className="h-full flex-1 bg-gradient-to-r from-purple-700 to-indigo-700" />
            </div>
            <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.12em] text-yellow-100">
              ⚠️ Public is all-in on LAL
            </p>
          </div>

          <div className="scoreboard-inner mt-7 grid grid-cols-3 gap-3">
            <ArenaActionButton
              active={lockedAction === "ride"}
              label="Ride LAL"
              percent="78%"
              tone="ride"
              onClick={() => setLockedAction("ride")}
            />
            <ArenaActionButton
              active={lockedAction === "draw"}
              label="Draw"
              percent="0%"
              tone="draw"
              onClick={() => setLockedAction("draw")}
            />
            <ArenaActionButton
              active={lockedAction === "fade"}
              label="Fade GSW"
              percent="22%"
              tone="fade"
              onClick={() => setLockedAction("fade")}
            />
          </div>

          {lockedAction && (
            <p className="mt-5 rounded-xl bg-white/10 px-3 py-2.5 text-center text-xs font-black uppercase tracking-[0.12em]">
              Locked. No switching sides.
            </p>
          )}

          <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
            🔒 Locks in when the quarter ends
          </p>
        </section>

        <nav className="mt-4 grid grid-cols-3 rounded-2xl border border-white/10 bg-black/45 p-1 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
          {(["game", "chat", "calls"] as ArenaTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`min-h-11 rounded-xl py-2 text-xs font-black capitalize transition ${
                activeTab === tab ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.12)]" : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="mt-4">
          {activeTab === "chat" && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_19rem] md:items-start">
              <ArenaChat />
              <RunTheArena onFadePublic={() => setLockedAction("fade")} />
            </div>
          )}

          {activeTab === "game" && <GameTab />}

          {activeTab === "calls" && <CallsTab />}
        </div>

      </div>
    </main>
  );
}

function TeamScore({
  city,
  seed,
  team,
  score,
  side,
}: {
  city: string;
  seed: string;
  team: string;
  score: string;
  side: "left" | "right";
}) {
  const isLeft = side === "left";

  return (
    <div className={`grid grid-cols-[auto_1fr] items-center gap-3 justify-self-center ${isLeft ? "text-left" : "text-right"}`}>
      <span
        className={`h-24 w-1.5 rounded-full sm:h-28 ${
          isLeft ? "bg-gradient-to-b from-yellow-300 to-green-300" : "order-2 bg-gradient-to-b from-sky-300 to-purple-500"
        }`}
      />
      <div className={isLeft ? "" : "order-1"}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{city}</p>
        <p className={`sports-display mt-2 text-3xl leading-none sm:text-5xl ${isLeft ? "text-green-100" : "text-indigo-100"}`}>{team}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{seed}</p>
        <p className="scoreboard-number mt-4 text-5xl sm:text-8xl">{score}</p>
      </div>
    </div>
  );
}

function ArenaActionButton({
  active,
  label,
  percent,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  percent: string;
  tone: "ride" | "draw" | "fade";
  onClick: () => void;
}) {
  const toneClass = {
    ride: active
      ? "border-green-200 bg-green-300 text-black shadow-[0_0_24px_rgba(45,212,191,0.28)]"
      : "border-green-300/30 bg-gradient-to-r from-green-500/85 to-teal-400/85 text-black",
    draw: active ? "border-white bg-white text-black" : "border-white/10 bg-gray-950 text-white",
    fade: active
      ? "border-purple-200 bg-gradient-to-r from-purple-300 to-indigo-300 text-black shadow-[0_0_24px_rgba(168,85,247,0.28)]"
      : "border-purple-300/30 bg-gradient-to-r from-purple-700/90 to-indigo-700/90 text-white",
  }[tone];
  const icon = tone === "ride" ? "⌃" : tone === "fade" ? "😈" : "×";

  return (
    <button
      onClick={onClick}
      className={`grid min-h-24 grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border px-3 py-4 text-left text-xs font-black transition active:scale-95 sm:px-4 ${toneClass}`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/25 text-lg">{icon}</span>
      <span>
        <span className="block text-sm">{label}</span>
        <span className="mt-1 block text-xs opacity-75">{percent}</span>
      </span>
    </button>
  );
}

function GameTab() {
  return (
    <>
      <WhoIsCooking />

      <section className="premium-card rounded-3xl border p-4">
        <h3 className="sports-display text-2xl leading-none">Live Momentum</h3>
        <p className="mt-1 text-xs text-gray-400">Momentum shifting toward LAL</p>

        <div className="mt-4 space-y-3">
          {["18’ LAL Goal", "42’ GSW Answer", "57’ LAL Run", "4th QTR Crowd pressure spikes"].map((event) => (
            <div key={event} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3">
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
    <section className="premium-card rounded-3xl border p-4">
      <h3 className="sports-display text-2xl leading-none">Top Takes</h3>

      <div className="mt-4 space-y-3">
        {topArenaTakes.map((take) => (
          <article key={take.handle} className="rounded-2xl border border-white/10 bg-black/45 p-4">
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
