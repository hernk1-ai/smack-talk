"use client";

import { useState } from "react";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";

type Side = "ride" | "fade";

type TrendingTake = {
  id: string;
  rank: number;
  handle: string;
  timestamp: string;
  text: string;
  heat: string;
  rides: string;
  fades: string;
  avatar: string;
  verified?: boolean;
};

type LiveArenaCard = {
  id: string;
  matchup: string;
  quarter: string;
  viewers: string;
  score: string;
  riding: string;
  fading: string;
  heat: string;
  trend: string;
  trendDirection: "up" | "down";
};

type ChaosAlert = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  time: string;
  tone: "green" | "orange" | "purple" | "red";
};

const trendingTakes: TrendingTake[] = [
  {
    id: "curry-choking",
    rank: 1,
    handle: "@TalkHeavy23",
    timestamp: "2m ago",
    text: "Curry is choking.",
    heat: "2.1K",
    rides: "1.3K",
    fades: "342",
    avatar: "TH",
    verified: true,
  },
  {
    id: "knicks-upset",
    rank: 2,
    handle: "@MidRange",
    timestamp: "5m ago",
    text: "Knicks upset incoming.",
    heat: "1.7K",
    rides: "1.0K",
    fades: "276",
    avatar: "MR",
    verified: true,
  },
  {
    id: "denver-sleeping",
    rank: 3,
    handle: "@BucketsOnly",
    timestamp: "7m ago",
    text: "The Crowd is sleeping on Denver.",
    heat: "1.3K",
    rides: "842",
    fades: "193",
    avatar: "BO",
    verified: true,
  },
  {
    id: "upset-waiting",
    rank: 4,
    handle: "@HoopDreams",
    timestamp: "9m ago",
    text: "This is an upset waiting.",
    heat: "1.1K",
    rides: "621",
    fades: "168",
    avatar: "HD",
    verified: true,
  },
];

const liveArenas: LiveArenaCard[] = [
  {
    id: "lal-gsw",
    matchup: "LAL vs GSW",
    quarter: "Q4 2:47",
    viewers: "12.8K",
    score: "108 - 103",
    riding: "62% Riding LAL",
    fading: "38% Fading GSW",
    heat: "3.6K",
    trend: "Trending",
    trendDirection: "up",
  },
  {
    id: "bos-nyk",
    matchup: "BOS vs NYK",
    quarter: "Q3 6:12",
    viewers: "7.3K",
    score: "89 - 92",
    riding: "41% Riding BOS",
    fading: "59% Fading NYK",
    heat: "1.9K",
    trend: "Fade Surge",
    trendDirection: "down",
  },
  {
    id: "mia-atl",
    matchup: "MIA vs ATL",
    quarter: "Q2 3:38",
    viewers: "5.1K",
    score: "64 - 58",
    riding: "72% Riding MIA",
    fading: "28% Fading ATL",
    heat: "1.2K",
    trend: "Ride Surge",
    trendDirection: "up",
  },
];

const chaosAlerts: ChaosAlert[] = [
  {
    id: "alpha-fade",
    icon: "◎",
    title: "94% rode Team Alpha.",
    detail: "Fade opportunity?",
    time: "2m ago",
    tone: "green",
  },
  {
    id: "collapse",
    icon: "▲",
    title: "Crowd collapse incoming.",
    detail: "Momentum shifting fast.",
    time: "4m ago",
    tone: "orange",
  },
  {
    id: "buckets-hit",
    icon: "ϟ",
    title: "BucketsOnly just hit again.",
    detail: "3 for 3 today.",
    time: "6m ago",
    tone: "purple",
  },
  {
    id: "toxic",
    icon: "☠",
    title: "Arena turning toxic.",
    detail: "Tempers high. Watch your back.",
    time: "8m ago",
    tone: "red",
  },
  {
    id: "omega",
    icon: "↗",
    title: "Sharp crowd fading Omega.",
    detail: "Insiders moving.",
    time: "11m ago",
    tone: "green",
  },
];

export function FeedScreen({ onEnterArena }: { onEnterArena: () => void }) {
  const [takeChoices, setTakeChoices] = useState<Record<string, Side>>({});

  function chooseTake(id: string, side: Side) {
    setTakeChoices((current) => ({ ...current, [id]: side }));
  }

  return (
    <div className="space-y-5">
      <FeedHeader />
      <FeaturedArenaCard onEnterArena={onEnterArena} />
      <TrendingTakes choices={takeChoices} onChoose={chooseTake} />
      <LiveArenas onEnterArena={onEnterArena} />
      <ChaosAlerts />
    </div>
  );
}

function FeedHeader() {
  return (
    <header className="rounded-[1.75rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.36)] backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SmackTalkLogo size={58} />
          <div className="min-w-0">
            <h1 className="brand-lockup text-[2rem] leading-[0.82] sm:text-4xl">
              <span className="block text-white">Smack</span>
              <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
                Talk
              </span>
            </h1>
          </div>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-gray-200">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(132,204,22,0.75)]" />
            12.8K <span className="text-gray-400">Online</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">Real talk. Live takes. All heat.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-xl text-white shadow-[0_0_22px_rgba(255,255,255,0.06)] transition active:scale-95"
            aria-label="Notifications"
          >
            ♧
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-purple-500 text-[10px] font-black text-white">
              3
            </span>
          </button>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-2xl text-purple-300 shadow-[0_0_24px_rgba(168,85,247,0.14)] transition active:scale-95"
            aria-label="Quick action"
          >
            ϟ
          </button>
        </div>
      </div>
    </header>
  );
}

function FeaturedArenaCard({ onEnterArena }: { onEnterArena: () => void }) {
  return (
    <section className="arena-scoreboard overflow-hidden rounded-[1.75rem] border border-lime-300/25 p-4 shadow-[0_26px_80px_rgba(0,0,0,0.56),0_0_34px_rgba(132,204,22,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-lime-300">
          <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(132,204,22,0.75)]" />
          Featured Live Arena
        </p>
        <span className="rounded-md border border-red-400/60 bg-red-500/10 px-2.5 py-1 text-xs font-black uppercase text-red-300">
          ▷ Live
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">Team LAL</p>
          <p className="scoreboard-number mt-2 text-6xl text-white">108</p>
        </div>
        <div className="pb-1">
          <p className="text-xs font-black uppercase text-purple-300">4th QTR</p>
          <p className="scoreboard-number mt-1 text-4xl text-white">2:47</p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300">
            <span className="h-2 w-2 rounded-full bg-lime-400" /> 12.8K Watching
          </p>
          <span className="mx-auto mt-2 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/55 text-[10px] font-black text-gray-300">
            VS
          </span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">Team GSW</p>
          <p className="scoreboard-number mt-2 text-6xl text-white">103</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase">
          <span className="text-lime-300">62% Riding LAL</span>
          <span className="text-purple-300">38% Fading GSW</span>
        </div>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/10">
          <div className="w-[62%] bg-gradient-to-r from-lime-400 to-lime-300" />
          <div className="w-3 bg-white/30" />
          <div className="flex-1 bg-gradient-to-r from-purple-700 to-purple-400" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 items-center rounded-2xl border border-white/10 bg-black/45 p-3">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400">Heat on the line</p>
          <p className="mt-1 text-2xl font-black text-orange-300">🔥 3.6K</p>
        </div>
        <div className="border-x border-white/10 px-3 text-center">
          <p className="text-[10px] font-black uppercase text-gray-400">Momentum</p>
          <Sparkline />
        </div>
        <div className="text-right">
          <p className="scoreboard-number text-3xl text-lime-300">LAL +21%</p>
          <p className="mt-1 text-[10px] font-black uppercase text-gray-400">Last 5 min</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onEnterArena}
        className="mt-4 min-h-14 w-full rounded-2xl border border-purple-300/70 bg-purple-500/10 text-sm font-black uppercase tracking-[0.16em] text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.18)] transition hover:bg-purple-500/15 active:scale-[0.98]"
      >
        ϟ Enter Arena
      </button>
    </section>
  );
}

function TrendingTakes({
  choices,
  onChoose,
}: {
  choices: Record<string, Side>;
  onChoose: (id: string, side: Side) => void;
}) {
  return (
    <FeedSection title="Trending Takes" icon="🔥" action="See all">
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {trendingTakes.map((take) => (
          <article
            key={take.id}
            className="premium-card min-w-[10.25rem] snap-start rounded-2xl border border-white/10 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.34)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-lime-400 text-xs font-black text-black">
                  {take.rank}
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-300 via-purple-500 to-black text-[10px] font-black text-white">
                  {take.avatar}
                </span>
              </div>
            </div>
            <p className="mt-3 truncate text-[11px] font-black text-gray-200">
              {take.handle} {take.verified && <span className="text-sky-300">◆</span>}
            </p>
            <p className="text-[10px] font-bold text-gray-500">{take.timestamp}</p>
            <h3 className="mt-3 min-h-14 text-xl font-black leading-tight text-white">{take.text}</h3>
            <p className="mt-3 text-sm font-black text-orange-300">🔥 {take.heat} <span className="text-xs uppercase text-gray-500">Heat</span></p>
            <div className="mt-3 flex items-center justify-between text-sm font-black">
              <span className="text-lime-300">👍 {take.rides}</span>
              <span className="text-purple-300">👎 {take.fades}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TakeButton active={choices[take.id] === "ride"} side="ride" onClick={() => onChoose(take.id, "ride")} />
              <TakeButton active={choices[take.id] === "fade"} side="fade" onClick={() => onChoose(take.id, "fade")} />
            </div>
          </article>
        ))}
      </div>
    </FeedSection>
  );
}

function LiveArenas({ onEnterArena }: { onEnterArena: () => void }) {
  return (
    <FeedSection title="Live Arenas" icon="≋" action="See all">
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {liveArenas.map((arena) => {
          const [left, right] = arena.matchup.split(" vs ");
          const [leftScore, rightScore] = arena.score.split(" - ");

          return (
            <article
              key={arena.id}
              className="arena-surface min-w-[16.5rem] snap-start rounded-2xl border border-lime-300/20 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.34)]"
            >
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-300">
                <span className="rounded-md border border-lime-300/70 px-2 py-1 text-lime-300">Live</span>
                <span>{arena.quarter}</span>
                <span>👥 {arena.viewers}</span>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
                <div>
                  <p className="sports-display text-3xl leading-none text-white">{left}</p>
                  <p className="scoreboard-number mt-2 text-4xl text-white">{leftScore}</p>
                </div>
                <span className="pb-3 text-xs font-black text-purple-200">VS</span>
                <div>
                  <p className="sports-display text-3xl leading-none text-white">{right}</p>
                  <p className="scoreboard-number mt-2 text-4xl text-white">{rightScore}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between gap-2 text-[10px] font-black uppercase">
                <span className="text-lime-300">{arena.riding}</span>
                <span className="text-purple-300">{arena.fading}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-black uppercase">
                <span className="text-orange-300">🔥 {arena.heat} Heat</span>
                <span className={arena.trendDirection === "up" ? "text-lime-300" : "text-purple-300"}>
                  {arena.trend} {arena.trendDirection === "up" ? "↑" : "↓"}
                </span>
              </div>
              <button
                type="button"
                onClick={onEnterArena}
                className="mt-4 min-h-11 w-full rounded-xl border border-lime-300/30 bg-lime-400/5 text-sm font-black uppercase text-lime-300 transition active:scale-[0.98]"
              >
                Enter Arena
              </button>
            </article>
          );
        })}
      </div>
    </FeedSection>
  );
}

function ChaosAlerts() {
  return (
    <FeedSection title="Chaos Alerts" icon="▴" action="See all">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
        {chaosAlerts.map((alert) => (
          <button
            key={alert.id}
            type="button"
            className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 px-3 py-3 text-left last:border-b-0 active:bg-white/5"
          >
            <span className={`grid h-9 w-9 place-items-center rounded-full text-xl ${toneClass(alert.tone, "bg")}`}>
              {alert.icon}
            </span>
            <span className="min-w-0">
              <span className={`block truncate text-sm font-black ${toneClass(alert.tone, "text")}`}>{alert.title}</span>
              <span className="block truncate text-xs font-semibold text-gray-400">{alert.detail}</span>
            </span>
            <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
              {alert.time}
              <span className="text-lg text-gray-400">›</span>
            </span>
          </button>
        ))}
      </div>
    </FeedSection>
  );
}

function FeedSection({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/30 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="sports-display text-2xl italic leading-none text-white">
          <span className="mr-2 not-italic">{icon}</span>
          {title}
        </h2>
        <button type="button" className="text-xs font-black uppercase text-purple-300">
          {action} ›
        </button>
      </div>
      {children}
    </section>
  );
}

function TakeButton({ active, side, onClick }: { active: boolean; side: Side; onClick: () => void }) {
  const isRide = side === "ride";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl border text-sm font-black uppercase transition active:scale-95 ${
        isRide
          ? active
            ? "border-lime-300 bg-lime-400 text-black shadow-[0_0_20px_rgba(132,204,22,0.24)]"
            : "border-lime-300/45 bg-lime-400/5 text-lime-300"
          : active
            ? "border-purple-300 bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.28)]"
            : "border-purple-300/55 bg-purple-500/10 text-purple-300"
      }`}
    >
      {isRide ? "Ride" : "Fade"}
    </button>
  );
}

function Sparkline() {
  return (
    <svg aria-hidden="true" viewBox="0 0 140 42" className="mt-2 h-11 w-full">
      <defs>
        <linearGradient id="sparklineGradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="58%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <polyline
        points="0,32 8,31 14,23 19,25 25,13 31,8 38,21 44,16 50,27 58,24 65,32 72,26 80,30 88,18 94,13 101,20 108,29 114,24 121,28 128,23 136,27"
        fill="none"
        stroke="url(#sparklineGradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function toneClass(tone: ChaosAlert["tone"], target: "text" | "bg") {
  const classes = {
    green: {
      text: "text-lime-300",
      bg: "bg-lime-400/10 text-lime-300",
    },
    orange: {
      text: "text-orange-300",
      bg: "bg-orange-400/10 text-orange-300",
    },
    purple: {
      text: "text-purple-300",
      bg: "bg-purple-500/10 text-purple-300",
    },
    red: {
      text: "text-red-300",
      bg: "bg-red-500/10 text-red-300",
    },
  };

  return classes[tone][target];
}
