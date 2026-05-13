"use client";

import { useState } from "react";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { UserAvatar } from "@/components/UserAvatar";
import type { Profile } from "@/lib/supabase/types";

type ReceiptTab = "my-receipts" | "viral" | "friends" | "community";
type ReceiptStatus = "win" | "loss";
type ReceiptSide = "riding" | "fading";

type RecentReceipt = {
  id: string;
  status: ReceiptStatus;
  timestamp: string;
  handle: string;
  avatar: string;
  take: string;
  arena: string;
  leftTeam: string;
  leftScore: string;
  rightTeam: string;
  rightScore: string;
  crowdResult: string;
  side: ReceiptSide;
  verdict: string;
  heat: string;
  views: string;
};

type ViralReceipt = {
  id: string;
  rank: number;
  hitRate: string;
  handle: string;
  avatar: string;
  take: string;
  arena: string;
  views: string;
  heat: string;
  comments: string;
  status: ReceiptStatus;
};

type PerformanceBadge = {
  name: string;
  subtitle: string;
  icon: string;
  tone: "green" | "purple" | "blue" | "red" | "teal";
};

type CurrentUserReceiptMeta = {
  handle: string;
  initials: string;
  avatarUrl?: string | null;
};

const receiptTabs: { id: ReceiptTab; label: string; icon: string }[] = [
  { id: "my-receipts", label: "My Receipts", icon: "▤" },
  { id: "viral", label: "Viral", icon: "🔥" },
  { id: "friends", label: "Friends", icon: "◌" },
  { id: "community", label: "Community", icon: "◎" },
];

const tabIntents: Record<ReceiptTab, { title: string; copy: string }> = {
  "my-receipts": {
    title: "Personal receipt history",
    copy: "Your locked takes, settled outcomes, and reputation trail. Talk backed up. Or exposed.",
  },
  viral: {
    title: "Most viewed receipts",
    copy: "The takes spreading fastest across the arena.",
  },
  friends: {
    title: "Receipts from your circle",
    copy: "Keep tabs on the people you argue with most.",
  },
  community: {
    title: "Hottest community receipts",
    copy: "The proof artifacts the whole Crowd is reacting to.",
  },
};

const recentReceipts: RecentReceipt[] = [
  {
    id: "curry-win",
    status: "win",
    timestamp: "2h ago",
    handle: "@TalkHeavy23",
    avatar: "TH",
    take: "Curry is choking.",
    arena: "LAL Arena",
    leftTeam: "LAL",
    leftScore: "108",
    rightTeam: "GSW",
    rightScore: "103",
    crowdResult: "97% Riding",
    side: "riding",
    verdict: "Your take hit",
    heat: "2.4K",
    views: "1.2M",
  },
  {
    id: "lakers-loss",
    status: "loss",
    timestamp: "1d ago",
    handle: "@BucketsOnly",
    avatar: "BO",
    take: "Lakers run the West.",
    arena: "LAL Arena",
    leftTeam: "LAL",
    leftScore: "98",
    rightTeam: "PHX",
    rightScore: "114",
    crowdResult: "81% Fading",
    side: "fading",
    verdict: "Take missed",
    heat: "1.1K",
    views: "532K",
  },
  {
    id: "knicks-win",
    status: "win",
    timestamp: "2d ago",
    handle: "@MidRange",
    avatar: "MR",
    take: "Knicks upset incoming.",
    arena: "NYK Arena",
    leftTeam: "NYK",
    leftScore: "121",
    rightTeam: "BOS",
    rightScore: "116",
    crowdResult: "92% Riding",
    side: "riding",
    verdict: "Your take hit",
    heat: "3.6K",
    views: "1.8M",
  },
  {
    id: "fade-crowd-win",
    status: "win",
    timestamp: "3d ago",
    handle: "@FadeKing",
    avatar: "FK",
    take: "Fade the Crowd.",
    arena: "BOS Arena",
    leftTeam: "BOS",
    leftScore: "101",
    rightTeam: "MIA",
    rightScore: "93",
    crowdResult: "89% Fading",
    side: "fading",
    verdict: "Your fade hit",
    heat: "2.2K",
    views: "912K",
  },
];

const viralReceipts: ViralReceipt[] = [
  {
    id: "viral-curry",
    rank: 1,
    hitRate: "97%",
    handle: "@TalkHeavy23",
    avatar: "TH",
    take: "Curry is choking.",
    arena: "LAL Arena",
    views: "2.4M",
    heat: "12.6K",
    comments: "4.3K",
    status: "win",
  },
  {
    id: "viral-knicks",
    rank: 2,
    hitRate: "94%",
    handle: "@MidRange",
    avatar: "MR",
    take: "Knicks upset incoming.",
    arena: "NYK Arena",
    views: "1.8M",
    heat: "8.9K",
    comments: "3.2K",
    status: "win",
  },
  {
    id: "viral-denver",
    rank: 3,
    hitRate: "91%",
    handle: "@FadeKing",
    avatar: "FK",
    take: "The Crowd is sleeping on Denver.",
    arena: "DEN Arena",
    views: "1.2M",
    heat: "6.4K",
    comments: "2.1K",
    status: "win",
  },
  {
    id: "viral-lakers",
    rank: 4,
    hitRate: "9%",
    handle: "@BucketsOnly",
    avatar: "BO",
    take: "Lakers run the West.",
    arena: "LAL Arena",
    views: "842K",
    heat: "3.1K",
    comments: "1.6K",
    status: "loss",
  },
];

const performanceBadges: PerformanceBadge[] = [
  { name: "Top Talker", subtitle: "Top 1%", icon: "◉", tone: "green" },
  { name: "Receipt King", subtitle: "100+ Wins", icon: "☠", tone: "purple" },
  { name: "Streak King", subtitle: "10+ Streak", icon: "ϟ", tone: "green" },
  { name: "Viral King", subtitle: "1M+ Views", icon: "▰", tone: "blue" },
  { name: "Accuracy God", subtitle: "65%+ Hit Rate", icon: "◎", tone: "red" },
  { name: "Crowd Rider", subtitle: "Ride Master", icon: "☍", tone: "teal" },
];

export function ReceiptsScreen({ profile }: { profile?: Profile | null }) {
  const [activeTab, setActiveTab] = useState<ReceiptTab>("my-receipts");
  const currentUser = getCurrentUserReceiptMeta(profile);

  return (
    <div className="space-y-5">
      <ReceiptsHeader profile={profile} />
      <ReceiptTabs activeTab={activeTab} onSelect={setActiveTab} />
      <TabIntentCard activeTab={activeTab} />

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
        <RecordCard />
        <div className="grid gap-3">
          <SideStatCard eyebrow="REP Total" value="9,250" unit="Top 2%" tone="green" body="+18% this month. Proof is compounding." />
          <SideStatCard eyebrow="Top Streak" value="12" unit="Wins in a row" tone="purple" body="Nobody could cool you off." />
          <SideStatCard eyebrow="Best Hit" value="97%" unit="Accuracy" tone="green" body="Knicks upset incoming." />
          <SideStatCard eyebrow="Most Viral" value="2.4M" unit="Views" tone="blue" body="Curry is choking." />
        </div>
      </section>

      <FeaturedReceipt />

      <ReceiptSection title="Recent Receipts" icon="▤" action="See all">
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {recentReceipts.map((receipt, index) => (
            <RecentReceiptCard
              key={receipt.id}
              receipt={receipt}
              currentUser={index === 0 ? currentUser : undefined}
            />
          ))}
        </div>
      </ReceiptSection>

      <ReceiptSection title="Viral Receipts" icon="🔥" action="See all">
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {viralReceipts.map((receipt, index) => (
            <ViralReceiptCard
              key={receipt.id}
              receipt={receipt}
              currentUser={index === 0 ? currentUser : undefined}
            />
          ))}
        </div>
      </ReceiptSection>

      <PerformanceBadges />

      <ShareReceiptsCard />
    </div>
  );
}

function ReceiptsHeader({ profile }: { profile?: Profile | null }) {
  const username = profile?.username || "Smack Talk";

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
          <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">Receipts don&apos;t lie.</p>
        </div>

        <div className="flex items-center gap-2">
          <HeaderIcon label="Notifications" badge="3">
            ♧
          </HeaderIcon>
          <HeaderIcon label={`${username} profile avatar`}>
            <UserAvatar avatarUrl={profile?.avatar_url} initials={getInitials(username)} size="sm" />
          </HeaderIcon>
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

function ReceiptTabs({
  activeTab,
  onSelect,
}: {
  activeTab: ReceiptTab;
  onSelect: (tab: ReceiptTab) => void;
}) {
  return (
    <nav
      className="grid grid-cols-4 gap-1 rounded-[1.5rem] border border-white/10 bg-black/35 p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur"
      aria-label="Receipt views"
    >
      {receiptTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          aria-pressed={activeTab === tab.id}
          className={`min-h-12 rounded-2xl border px-1 text-[9px] font-black uppercase leading-tight transition hover:-translate-y-0.5 active:scale-95 min-[390px]:text-[10px] sm:text-xs ${
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

function TabIntentCard({ activeTab }: { activeTab: ReceiptTab }) {
  const intent = tabIntents[activeTab];

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-4 py-3 shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{intent.title}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-gray-400">{intent.copy}</p>
    </div>
  );
}

function RecordCard() {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.42),0_0_30px_rgba(132,204,22,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="sports-display text-3xl italic leading-none text-white">Your Record</h2>
        <button
          type="button"
          className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-bold text-gray-300 transition active:scale-95"
        >
          All Time⌄
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-lime-300/20 bg-black/45 min-[430px]:grid-cols-4">
        <RecordMetric label="Wins" value="127" tone="text-lime-300" />
        <RecordMetric label="Hits" value="68%" tone="text-white" />
        <RecordMetric label="Losses" value="59" tone="text-purple-300" />
        <RecordMetric label="Difference" value="+2,840" tone="text-lime-300" />
      </div>

      <p className="mt-4 text-sm font-semibold text-gray-400">You talk it. You lock it. You own it.</p>

      <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-black/45 p-3 min-[430px]:grid-cols-[auto_1fr_auto]">
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

function RecordMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-r border-b border-white/10 p-3 even:border-r-0 min-[430px]:border-b-0 min-[430px]:even:border-r min-[430px]:last:border-r-0">
      <p className={`text-[10px] font-black uppercase ${tone}`}>{label}</p>
      <p className={`scoreboard-number mt-3 text-[1.65rem] sm:text-4xl ${tone}`}>{value}</p>
    </div>
  );
}

function SideStatCard({
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

function ReceiptSection({
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
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">
          <span className="mr-2 not-italic">{icon}</span>
          {title}
        </h2>
        <button type="button" className="rounded-full px-2 py-1 text-xs font-black uppercase text-purple-300 transition hover:bg-purple-500/10 hover:text-purple-100 active:scale-95">
          {action} ›
        </button>
      </div>
      {children}
    </section>
  );
}

function FeaturedReceipt() {
  return (
    <section className="isolate rounded-[1.75rem] border border-white/10 bg-[#05070d]/90 p-4 shadow-[0_20px_58px_rgba(0,0,0,0.42)] transition hover:border-lime-300/20 hover:shadow-[0_24px_66px_rgba(0,0,0,0.5)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">
          <span className="mr-2 not-italic">🔥</span>
          Featured Receipt
        </h2>
        <span className="rounded-md bg-lime-400/15 px-2 py-1 text-[10px] font-black uppercase text-lime-300">Win</span>
      </div>

      <article className="relative isolate overflow-hidden rounded-2xl border border-lime-300/25 bg-[#061006]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-lime-300/40 sm:p-5">
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2 bg-[radial-gradient(circle_at_70%_34%,rgba(132,204,22,0.22),transparent_48%)]" />
        <div className="relative z-10 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-gray-400">2d ago</p>
              <span className="rounded-full border border-lime-300/30 bg-lime-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-lime-300">
                Shareable
              </span>
            </div>
            <h3 className="mt-3 text-3xl font-black italic leading-tight text-white sm:text-4xl">Knicks upset incoming.</h3>
            <p className="mt-2 text-xs font-black uppercase text-sky-300">NYK Arena</p>

            <div className="mt-5 grid max-w-sm grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
              <ScoreMini team="NYK" score="121" />
              <span className="pb-2 text-2xl text-purple-200">ϟ</span>
              <ScoreMini team="BOS" score="116" />
            </div>
          </div>

          <div className="rounded-2xl border border-lime-300/25 bg-black/70 p-3 shadow-[0_0_26px_rgba(132,204,22,0.1)] md:w-56">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">Your Take Hit</p>
            <p className="mt-1 text-sm font-semibold text-gray-300">Locked before tip. Receipt held.</p>
            <p className="scoreboard-number mt-3 text-6xl leading-none text-white drop-shadow-[0_0_18px_rgba(132,204,22,0.22)]">92%</p>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-lime-300">Ride Hit</p>
          </div>
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/65 p-2 text-center text-xs font-black text-gray-400">
          <span className="rounded-lg py-1 transition hover:bg-white/[0.04]">🔥 3.6K</span>
          <span className="rounded-lg py-1 transition hover:bg-white/[0.04]">◉ 1.8M</span>
          <span className="rounded-lg py-1 transition hover:bg-white/[0.04]">▱ 842</span>
          <span className="rounded-lg py-1 text-purple-200 transition hover:bg-purple-500/10">⇧</span>
        </div>
      </article>
    </section>
  );
}

function RecentReceiptCard({
  receipt,
  currentUser,
}: {
  receipt: RecentReceipt;
  currentUser?: CurrentUserReceiptMeta;
}) {
  const isWin = receipt.status === "win";
  const handle = currentUser?.handle ?? receipt.handle;

  return (
    <article
      className={`min-w-[72vw] max-w-[15rem] snap-start rounded-2xl border bg-black/45 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.34)] transition hover:-translate-y-1 active:scale-[0.985] sm:min-w-[13.75rem] ${
        isWin
          ? "border-lime-300/35 hover:shadow-[0_20px_52px_rgba(132,204,22,0.12)]"
          : "border-red-300/35 hover:shadow-[0_20px_52px_rgba(248,113,113,0.1)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${
            isWin ? "bg-lime-400/15 text-lime-300" : "bg-red-500/15 text-red-300"
          }`}
        >
          {receipt.status}
        </span>
        <span className="text-[10px] font-bold text-gray-500">{receipt.timestamp}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <UserAvatar
          avatarUrl={currentUser?.avatarUrl}
          initials={currentUser?.initials ?? receipt.avatar}
          label={`${handle} avatar`}
          size="sm"
        />
        <p className="truncate text-xs font-black text-white">
          {handle} <span className="text-sky-300">◆</span>
        </p>
      </div>

      <h3 className="mt-3 min-h-14 text-xl font-black leading-tight text-white">{receipt.take}</h3>
      <p className="text-xs font-black uppercase text-lime-300">{receipt.arena}</p>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
        <ScoreMini team={receipt.leftTeam} score={receipt.leftScore} />
        <span className="pb-2 text-xl text-gray-300">ϟ</span>
        <ScoreMini team={receipt.rightTeam} score={receipt.rightScore} />
      </div>

      <div className={`mt-4 grid grid-cols-2 gap-2 rounded-xl border p-2 text-xs font-black uppercase ${isWin ? "border-lime-300/20 bg-lime-400/10" : "border-red-300/20 bg-red-500/10"}`}>
        <span className={receipt.side === "riding" ? "text-lime-300" : "text-purple-300"}>{receipt.crowdResult}</span>
        <span className={`text-right ${isWin ? "text-lime-300" : "text-red-300"}`}>{receipt.verdict}</span>
      </div>

      <div className="mt-3 flex justify-between text-xs font-black text-gray-400">
        <span>🔥 {receipt.heat}</span>
        <span>◉ {receipt.views}</span>
      </div>
    </article>
  );
}

function ScoreMini({ team, score }: { team: string; score: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400">{team}</p>
      <p className="scoreboard-number mt-1 text-3xl text-white">{score}</p>
    </div>
  );
}

function ViralReceiptCard({
  receipt,
  currentUser,
}: {
  receipt: ViralReceipt;
  currentUser?: CurrentUserReceiptMeta;
}) {
  const isWin = receipt.status === "win";
  const handle = currentUser?.handle ?? receipt.handle;

  return (
    <article
      className={`relative min-w-[72vw] max-w-[15rem] snap-start overflow-hidden rounded-2xl border bg-black/45 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.34)] transition hover:-translate-y-1 active:scale-[0.985] sm:min-w-[13.75rem] ${
        isWin
          ? "border-lime-300/35 hover:shadow-[0_20px_52px_rgba(132,204,22,0.12)]"
          : "border-red-300/35 hover:shadow-[0_20px_52px_rgba(248,113,113,0.1)]"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rotate-45 bg-gradient-to-br from-purple-500/50 to-lime-400/20" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${
              isWin ? "bg-lime-400/15 text-lime-300" : "bg-red-500/15 text-red-300"
            }`}
          >
            {receipt.hitRate} hit
          </span>
          <span className="sports-display text-2xl italic leading-none text-white">#{receipt.rank}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <UserAvatar
            avatarUrl={currentUser?.avatarUrl}
            initials={currentUser?.initials ?? receipt.avatar}
            label={`${handle} avatar`}
            size="sm"
          />
          <p className="truncate text-xs font-black text-white">
            {handle} <span className="text-sky-300">◆</span>
          </p>
        </div>

        <h3 className="mt-3 min-h-16 text-xl font-black leading-tight text-white">{receipt.take}</h3>
        <p className="text-xs font-black uppercase text-lime-300">{receipt.arena}</p>

        <p className="scoreboard-number mt-5 text-5xl text-gray-200">
          ◉ {receipt.views}
          <span className="ml-1 text-xs font-black uppercase tracking-normal text-gray-500">Views</span>
        </p>

        <div className="mt-4 flex justify-between text-xs font-black text-gray-400">
          <span>🔥 {receipt.heat}</span>
          <span>▰ {receipt.comments}</span>
        </div>
      </div>
    </article>
  );
}

function PerformanceBadges() {
  return (
    <ReceiptSection title="Performance Badges" icon="◎" action="View all">
      <div className="grid grid-cols-2 gap-3 min-[430px]:grid-cols-3 md:grid-cols-6">
        {performanceBadges.map((badge) => (
          <PerformanceBadgeCard key={badge.name} badge={badge} />
        ))}
      </div>
    </ReceiptSection>
  );
}

function PerformanceBadgeCard({ badge }: { badge: PerformanceBadge }) {
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

function ShareReceiptsCard() {
  return (
    <section className="rounded-[1.75rem] border border-purple-300/30 bg-purple-500/10 p-4 shadow-[0_0_34px_rgba(168,85,247,0.14)]">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-purple-300/30 bg-purple-500/15 text-4xl">
          ◄
        </div>
        <div>
          <h2 className="sports-display text-3xl italic leading-none text-purple-300">The world is watching.</h2>
          <p className="mt-2 text-sm font-semibold text-gray-300">Your receipts. Your legacy. Your name on the board.</p>
        </div>
        <button
          type="button"
          className="min-h-12 rounded-2xl border border-purple-300/60 bg-purple-500/15 px-5 text-sm font-black uppercase tracking-[0.1em] text-purple-100 shadow-[0_0_24px_rgba(168,85,247,0.14)] transition hover:-translate-y-0.5 hover:bg-purple-500/25 hover:shadow-[0_0_34px_rgba(168,85,247,0.24)] active:scale-95"
        >
          Share Your Receipts ⇧
        </button>
      </div>
    </section>
  );
}

function getCurrentUserReceiptMeta(profile?: Profile | null): CurrentUserReceiptMeta {
  const username = profile?.username || "TalkHeavy23";

  return {
    handle: `@${username.replace(/^@/, "")}`,
    initials: getInitials(username),
    avatarUrl: profile?.avatar_url,
  };
}

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}
