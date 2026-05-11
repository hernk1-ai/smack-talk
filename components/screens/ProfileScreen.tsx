"use client";

import { useState } from "react";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";

type ProfileTab = "overview" | "takes" | "stats" | "badges" | "activity";
type TakeStatus = "win" | "loss";

type ProfileStat = {
  label: string;
  value: string;
  detail?: string;
  tone: "green" | "purple" | "white";
};

type RecentTake = {
  id: string;
  status: TakeStatus;
  time: string;
  arena: string;
  take: string;
  ride: string;
  heat: string;
  icon: string;
};

type ArenaRecord = {
  rank: number;
  arena: string;
  record: string;
  hitRate: string;
  icon: string;
};

type Badge = {
  name: string;
  subtitle: string;
  icon: string;
  tone: "green" | "purple" | "blue" | "red" | "teal";
};

const profileTabs: { id: ProfileTab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "♙" },
  { id: "takes", label: "Takes", icon: "▱" },
  { id: "stats", label: "Stats", icon: "▥" },
  { id: "badges", label: "Badges", icon: "◎" },
  { id: "activity", label: "Activity", icon: "▤" },
];

const tabCopy: Record<ProfileTab, string> = {
  overview: "Your REP hub and latest proof.",
  takes: "Locked takes, settled receipts, and the trail behind them.",
  stats: "Performance splits, heat, accuracy, and ranking movement.",
  badges: "Collectible proof that your talk travels.",
  activity: "Recent reactions, follows, callouts, and arena movement.",
};

const stats: ProfileStat[] = [
  { label: "Wins", value: "127", detail: "58%", tone: "green" },
  { label: "Hits", value: "68%", tone: "white" },
  { label: "Losses", value: "59", detail: "27%", tone: "purple" },
  { label: "Difference", value: "+2,840", tone: "green" },
  { label: "Heat", value: "28.6K", detail: "🔥", tone: "green" },
  { label: "Followers", value: "4.2K", tone: "white" },
  { label: "Following", value: "312", tone: "white" },
];

const recentTakes: RecentTake[] = [
  { id: "knicks", status: "win", time: "2d ago", arena: "NYK Arena", take: "Knicks upset incoming.", ride: "92%", heat: "3.6K", icon: "NYK" },
  { id: "celtics", status: "win", time: "2d ago", arena: "BOS Arena", take: "Celtics frauds exposed.", ride: "87%", heat: "2.9K", icon: "BOS" },
  { id: "lakers", status: "loss", time: "4d ago", arena: "LAL Arena", take: "Lakers run the West.", ride: "18%", heat: "1.1K", icon: "LAL" },
  { id: "warriors", status: "win", time: "5d ago", arena: "GSW Arena", take: "Warriors bounce back tonight.", ride: "78%", heat: "2.3K", icon: "GSW" },
  { id: "denver", status: "win", time: "2d ago", arena: "DEN Arena", take: "Denver > Everyone.", ride: "90%", heat: "2.7K", icon: "DEN" },
];

const favoriteArenas: ArenaRecord[] = [
  { rank: 1, arena: "NYK Arena", record: "92-48", hitRate: "65%", icon: "NYK" },
  { rank: 2, arena: "BOS Arena", record: "88-52", hitRate: "63%", icon: "BOS" },
  { rank: 3, arena: "GSW Arena", record: "79-61", hitRate: "56%", icon: "GSW" },
  { rank: 4, arena: "DAL Arena", record: "70-60", hitRate: "54%", icon: "DAL" },
];

const badges: Badge[] = [
  { name: "Top Talker", subtitle: "Top 1%", icon: "◉", tone: "green" },
  { name: "Receipt King", subtitle: "100+ Wins", icon: "☠", tone: "purple" },
  { name: "Streak King", subtitle: "10+ Streak", icon: "ϟ", tone: "green" },
  { name: "Viral King", subtitle: "1M+ Views", icon: "▰", tone: "blue" },
  { name: "Accuracy God", subtitle: "65%+ Hit Rate", icon: "◎", tone: "red" },
  { name: "Crowd Rider", subtitle: "Ride Master", icon: "☍", tone: "teal" },
];

export function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  return (
    <div className="space-y-4">
      <ProfileHeader />
      <ProfileHero />
      <StatsRow />
      <LevelCard />
      <ProfileTabs activeTab={activeTab} onSelect={setActiveTab} />
      <p className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold leading-5 text-gray-400">
        <span className="mr-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{activeTab}</span>
        {tabCopy[activeTab]}
      </p>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
        <FeaturedReceipt />
        <AchievementStack />
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
        <RecentTakes />
        <FavoriteArenas />
      </section>

      <BadgesSection />
    </div>
  );
}

function ProfileHeader() {
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
          <HeaderIcon label="Notifications" badge="3">
            ♧
          </HeaderIcon>
          <HeaderIcon label="Quick action">ϟ</HeaderIcon>
        </div>
      </div>
    </header>
  );
}

function HeaderIcon({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-xl text-white shadow-[0_0_22px_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-purple-300/35 hover:bg-white/[0.07] active:scale-95"
      aria-label={label}
    >
      {children}
      {badge && (
        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-purple-500 text-[10px] font-black text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function ProfileHero() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition hover:border-white/15 sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(132,204,22,0.22),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(168,85,247,0.2),transparent_34%)]" />
      <div className="relative grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="relative mx-auto md:mx-0">
          <div className="grid h-28 w-28 place-items-center rounded-full border border-lime-300/60 bg-gradient-to-br from-lime-300 via-purple-500 to-black text-2xl font-black text-white shadow-[0_0_34px_rgba(132,204,22,0.35)] ring-4 ring-lime-300/10">
            TH
          </div>
          <span className="absolute bottom-2 right-0 h-5 w-5 rounded-full border-2 border-black bg-lime-400 shadow-[0_0_18px_rgba(132,204,22,0.9)]" />
        </div>

        <div className="min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 className="text-3xl font-black italic leading-none text-white sm:text-4xl">@TalkHeavy23</h2>
            <span className="text-sky-300">◆</span>
          </div>
          <span className="mt-2 inline-flex rounded-lg border border-lime-300/40 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
            ϟ Top Talker
          </span>
          <p className="mt-2 text-sm font-semibold text-gray-300">I talk it. I lock it. I own it.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
            {["Heat Seeker", "Crowd Rider", "3x Streak King"].map((tag) => (
              <span key={tag} className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-black uppercase text-gray-300 shadow-[0_0_14px_rgba(255,255,255,0.03)]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-lime-300/25 bg-black/50 p-4 shadow-[0_0_34px_rgba(132,204,22,0.12)] transition hover:-translate-y-0.5 hover:border-lime-300/40 hover:shadow-[0_0_42px_rgba(132,204,22,0.18)] md:w-56">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(132,204,22,0.18),transparent_34%)]" />
          <button
            type="button"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-200 transition hover:border-purple-300/40 hover:bg-purple-500/10 active:scale-95"
            aria-label="Settings"
          >
            ⚙
          </button>
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-300">REP Total</p>
            <p className="scoreboard-number mt-2 text-6xl text-lime-300">9,250</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase text-gray-300">Top 2%</p>
              <p className="rounded-full border border-lime-300/25 bg-lime-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-lime-300">
                ▲ +18% This Month
              </p>
            </div>
            <ReputationSparkline />
          </div>
        </div>
      </div>
    </section>
  );
}

function ReputationSparkline() {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/35 px-2 py-2 shadow-inner shadow-black/40">
      <svg className="h-11 w-full overflow-visible" viewBox="0 0 180 44" role="img" aria-label="Reputation trend rising">
        <defs>
          <linearGradient id="profile-reputation-sparkline" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#84cc16" />
            <stop offset="58%" stopColor="#bef264" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="profile-reputation-glow" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M4 34 C18 31 23 36 36 27 S58 25 68 18 S88 22 101 15 S125 12 137 8 S158 14 176 4"
          fill="none"
          stroke="url(#profile-reputation-sparkline)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          filter="url(#profile-reputation-glow)"
        />
        <path
          d="M4 38 C22 35 35 36 52 30 S80 26 101 21 S140 17 176 8"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <circle className="animate-pulse" cx="176" cy="4" fill="#c084fc" r="4" />
      </svg>
    </div>
  );
}

function StatsRow() {
  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 shadow-[0_18px_48px_rgba(0,0,0,0.34)] min-[430px]:grid-cols-4 md:grid-cols-7">
      {stats.map((stat) => (
        <ProfileStatCard key={stat.label} stat={stat} />
      ))}
    </section>
  );
}

function ProfileStatCard({ stat }: { stat: ProfileStat }) {
  const toneClass = {
    green: "text-lime-300",
    purple: "text-purple-300",
    white: "text-white",
  }[stat.tone];

  return (
    <div className="border-r border-b border-white/10 p-3 text-center transition hover:bg-white/[0.035] last:border-r-0 md:border-b-0">
      <p className="text-[10px] font-black uppercase text-gray-400">{stat.label}</p>
      <p className={`scoreboard-number mt-2 text-3xl ${toneClass}`}>{stat.value}</p>
      {stat.detail && <p className="mt-1 text-xs font-black uppercase text-gray-500">{stat.detail}</p>}
    </div>
  );
}

function LevelCard() {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.34)] transition hover:border-purple-300/25 hover:shadow-[0_20px_58px_rgba(0,0,0,0.42)]">
      <div className="grid grid-cols-[auto_1fr] items-center gap-4 min-[430px]:grid-cols-[auto_1fr_auto]">
        <div className="rounded-2xl border border-purple-300/40 bg-purple-500/10 px-4 py-3 text-center">
          <p className="text-[10px] font-black uppercase text-purple-200">Level</p>
          <p className="scoreboard-number mt-1 text-4xl text-purple-200">18</p>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black uppercase text-purple-200">7,160 REP to Level 19</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-purple-500 to-lime-300" />
          </div>
        </div>

        <div className="col-span-2 grid place-items-center min-[430px]:col-span-1">
          <div className="grid h-20 w-20 place-items-center rounded-[1.4rem] border border-purple-300/40 bg-purple-500/15 shadow-[0_0_28px_rgba(168,85,247,0.18)]">
            <span className="text-4xl">☠</span>
            <span className="-mt-2 rounded-md border border-purple-300/40 bg-black/50 px-2 py-0.5 text-[10px] font-black uppercase text-purple-200">
              Talker
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileTabs({
  activeTab,
  onSelect,
}: {
  activeTab: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
}) {
  return (
    <nav
      className="grid grid-cols-5 gap-1 rounded-[1.5rem] border border-white/10 bg-black/35 p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur"
      aria-label="Profile views"
    >
      {profileTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={activeTab === tab.id}
          onClick={() => onSelect(tab.id)}
          className={`min-h-11 rounded-2xl border px-1 text-[8px] font-black uppercase leading-tight transition duration-200 hover:-translate-y-0.5 active:scale-95 min-[390px]:text-[9px] sm:text-xs ${
            activeTab === tab.id
              ? "border-purple-300/70 bg-gradient-to-b from-purple-500/28 to-purple-500/10 text-white shadow-[0_0_24px_rgba(168,85,247,0.2),inset_0_-2px_0_rgba(168,85,247,0.95)]"
              : "border-transparent text-gray-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-gray-200"
          }`}
        >
          <span className="mr-1">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function FeaturedReceipt() {
  return (
    <section className="isolate rounded-[1.75rem] border border-white/10 bg-[#05070d]/90 p-4 shadow-[0_20px_58px_rgba(0,0,0,0.42)] transition hover:border-lime-300/20 hover:shadow-[0_24px_66px_rgba(0,0,0,0.5)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="sports-display text-2xl italic leading-none text-white">
          <span className="mr-2 not-italic">🔥</span>
          Featured Receipt
        </h2>
        <span className="rounded-md bg-lime-400/15 px-2 py-1 text-[10px] font-black uppercase text-lime-300">Win</span>
      </div>

      <article className="relative isolate overflow-hidden rounded-2xl border border-lime-300/25 bg-[#061006]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-lime-300/40 sm:p-5">
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2 bg-[radial-gradient(circle_at_70%_34%,rgba(132,204,22,0.22),transparent_48%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-gray-400">2d ago</p>
            <span className="rounded-full border border-lime-300/30 bg-lime-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-lime-300">
              Shareable
            </span>
          </div>
          <h3 className="mt-3 max-w-[15rem] text-3xl font-black italic leading-tight text-white sm:text-4xl">Knicks upset incoming.</h3>
          <p className="mt-2 text-xs font-black uppercase text-sky-300">NYK Arena</p>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
            <ScoreMini team="NYK" score="121" />
            <span className="pb-2 text-2xl text-purple-200">ϟ</span>
            <ScoreMini team="BOS" score="116" />
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-lime-300/25 bg-black/70 p-3 shadow-[0_0_26px_rgba(132,204,22,0.1)] min-[430px]:grid-cols-[1fr_auto] min-[430px]:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">Your Take Hit</p>
              <p className="mt-1 text-sm font-semibold text-gray-300">Locked before tip. Receipt held.</p>
            </div>
            <div className="text-left min-[430px]:text-right">
              <p className="scoreboard-number text-6xl leading-none text-white drop-shadow-[0_0_18px_rgba(132,204,22,0.22)]">92%</p>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-lime-300">Ride Hit</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/65 p-2 text-center text-xs font-black text-gray-400">
            <span className="rounded-lg py-1 transition hover:bg-white/[0.04]">🔥 3.6K</span>
            <span className="rounded-lg py-1 transition hover:bg-white/[0.04]">◉ 1.8M</span>
            <span className="rounded-lg py-1 transition hover:bg-white/[0.04]">▱ 842</span>
            <span className="rounded-lg py-1 text-purple-200 transition hover:bg-purple-500/10">⇧</span>
          </div>
        </div>
      </article>

      <button
        type="button"
        className="mt-3 min-h-12 w-full rounded-2xl border border-purple-300/55 bg-purple-500/10 text-sm font-black uppercase tracking-[0.1em] text-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-500/20 hover:shadow-[0_0_24px_rgba(168,85,247,0.16)] active:scale-95"
      >
        View All Receipts
      </button>
    </section>
  );
}

function ScoreMini({ team, score }: { team: string; score: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400">{team}</p>
      <p className="scoreboard-number mt-1 text-4xl text-white">{score}</p>
    </div>
  );
}

function AchievementStack() {
  return (
    <div className="grid gap-3">
      <AchievementCard eyebrow="Take Streak" value="12" unit="Wins in a row" tone="purple" body="Your longest streak ever." />
      <AchievementCard eyebrow="Best Hit" value="97%" unit="Accuracy" tone="green" body="Knicks upset incoming." />
      <AchievementCard eyebrow="Most Viral Take" value="2.4M" unit="Views" tone="blue" body="Curry is choking." />
    </div>
  );
}

function AchievementCard({
  eyebrow,
  value,
  unit,
  tone,
  body,
}: {
  eyebrow: string;
  value: string;
  unit: string;
  tone: "purple" | "green" | "blue";
  body: string;
}) {
  const toneClass = {
    purple: "text-purple-300 border-purple-300/25 bg-purple-500/10",
    green: "text-lime-300 border-lime-300/25 bg-lime-400/10",
    blue: "text-blue-300 border-blue-300/25 bg-blue-500/10",
  }[tone];

  return (
    <article className={`rounded-[1.5rem] border p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_58px_rgba(0,0,0,0.42)] ${toneClass}`}>
      <p className="sports-display text-xl italic leading-none text-white">{eyebrow}</p>
      <div className="mt-3 flex items-end gap-3">
        <p className={`scoreboard-number text-5xl ${toneClass.split(" ")[0]}`}>{value}</p>
        <p className="pb-1 text-xs font-black uppercase tracking-[0.1em] text-gray-300">{unit}</p>
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-gray-300">{body}</p>
    </article>
  );
}

function RecentTakes() {
  return (
    <section className="isolate rounded-[1.75rem] border border-white/10 bg-[#05070d]/90 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.42)]">
      <SectionHeader title="Recent Takes" action="See all" />
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/70">
        {recentTakes.map((take) => (
          <TakeRow key={take.id} take={take} />
        ))}
      </div>
      <button className="mt-3 min-h-11 w-full rounded-2xl border border-purple-300/55 bg-purple-500/10 text-xs font-black uppercase tracking-[0.1em] text-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.14)] active:scale-95">
        View All Takes
      </button>
    </section>
  );
}

function TakeRow({ take }: { take: RecentTake }) {
  const isWin = take.status === "win";

  return (
    <article className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 transition hover:bg-white/[0.035] active:bg-white/[0.05]">
      <div className="text-center">
        <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${isWin ? "bg-lime-400/15 text-lime-300" : "bg-red-500/15 text-red-300"}`}>
          {take.status}
        </span>
        <p className="mt-1 text-[10px] font-bold text-gray-500">{take.time}</p>
      </div>
      <ArenaIcon label={take.icon} />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{take.take}</p>
        <p className="truncate text-[10px] font-black uppercase text-purple-300">{take.arena}</p>
      </div>
      <div className="grid grid-cols-[2.8rem_2.8rem_auto] items-center gap-1.5 text-right min-[390px]:grid-cols-[3.2rem_3.2rem_auto] min-[390px]:gap-2">
        <div>
          <p className="text-[8px] font-black uppercase text-gray-500">Ride %</p>
          <p className={`text-sm font-black ${isWin ? "text-lime-300" : "text-purple-300"}`}>{take.ride}</p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase text-gray-500">Heat</p>
          <p className="text-sm font-black text-lime-300">🔥 {take.heat}</p>
        </div>
        <span className="text-2xl text-gray-400">›</span>
      </div>
    </article>
  );
}

function FavoriteArenas() {
  return (
    <section className="isolate rounded-[1.75rem] border border-white/10 bg-[#05070d]/90 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.42)]">
      <SectionHeader title="Favorite Arenas" action="See all" />
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/70">
        {favoriteArenas.map((arena) => (
          <ArenaRow key={arena.rank} arena={arena} />
        ))}
      </div>
      <button className="mt-3 min-h-11 w-full rounded-2xl border border-purple-300/55 bg-purple-500/10 text-xs font-black uppercase tracking-[0.1em] text-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.14)] active:scale-95">
        View All Arenas
      </button>
    </section>
  );
}

function ArenaRow({ arena }: { arena: ArenaRecord }) {
  return (
    <article className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 transition hover:bg-white/[0.035] active:bg-white/[0.05]">
      <span className="scoreboard-number text-xl text-gray-300">{arena.rank}</span>
      <ArenaIcon label={arena.icon} />
      <div>
        <p className="text-sm font-black text-white">{arena.arena}</p>
        <p className="text-lg font-black text-gray-200">{arena.record}</p>
        <p className="text-[9px] font-black uppercase text-gray-500">Win-Loss</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-lime-300">{arena.hitRate}</p>
        <p className="text-[9px] font-black uppercase text-gray-500">Hit Rate</p>
      </div>
    </article>
  );
}

function ArenaIcon({ label }: { label: string }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-sky-300/40 bg-gradient-to-br from-lime-300 via-purple-500 to-black text-[10px] font-black text-white">
      {label}
    </span>
  );
}

function BadgesSection() {
  return (
    <section className="isolate rounded-[1.75rem] border border-white/10 bg-[#05070d]/90 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.42)]">
      <SectionHeader title="Badges" action="View all" />
      <div className="mt-4 grid grid-cols-2 gap-3 min-[430px]:grid-cols-3 md:grid-cols-6">
        {badges.map((badge) => (
          <BadgeCard key={badge.name} badge={badge} />
        ))}
      </div>
    </section>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const toneClass = {
    green: "border-lime-300/30 text-lime-300 shadow-[0_0_24px_rgba(132,204,22,0.12)]",
    purple: "border-purple-300/30 text-purple-300 shadow-[0_0_24px_rgba(168,85,247,0.12)]",
    blue: "border-blue-300/30 text-blue-300 shadow-[0_0_24px_rgba(96,165,250,0.1)]",
    red: "border-red-300/30 text-red-300 shadow-[0_0_24px_rgba(248,113,113,0.1)]",
    teal: "border-teal-300/30 text-teal-300 shadow-[0_0_24px_rgba(45,212,191,0.1)]",
  }[badge.tone];

  return (
    <article className={`group rounded-2xl border bg-black/35 p-3 text-center transition duration-200 hover:-translate-y-1 hover:bg-white/[0.035] hover:shadow-[0_0_30px_currentColor] active:scale-[0.985] ${toneClass}`}>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-current bg-current/10 text-2xl transition group-hover:scale-105">
        {badge.icon}
      </div>
      <p className="mt-3 text-[10px] font-black uppercase">{badge.name}</p>
      <p className="mt-1 text-[10px] font-semibold text-gray-500">{badge.subtitle}</p>
    </article>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="sports-display text-2xl italic leading-none text-white">{title}</h2>
      <button type="button" className="rounded-full px-2 py-1 text-xs font-black uppercase text-purple-300 transition hover:bg-purple-500/10 hover:text-purple-100 active:scale-95">
        {action}
      </button>
    </div>
  );
}
