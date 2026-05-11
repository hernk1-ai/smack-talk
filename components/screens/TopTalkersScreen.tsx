"use client";

import { useState } from "react";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";

type TalkersTab = "overall" | "wins" | "heat" | "viral" | "accuracy";

type PodiumTalker = {
  rank: 1 | 2 | 3;
  handle: string;
  avatar: string;
  heat: string;
  wins: string;
  accuracy: string;
  viral: string;
};

type TalkerRow = {
  rank: number;
  handle: string;
  avatar: string;
  subtitle: string;
  badge?: string;
  heat: string;
  wins: string;
  accuracy: string;
  viral: string;
};

type CategoryCard = {
  title: string;
  subtitle: string;
  icon: string;
  tone: "heat" | "viral" | "clutch";
  avatars: string[];
};

const talkersTabs: { id: TalkersTab; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "wins", label: "Wins" },
  { id: "heat", label: "Heat" },
  { id: "viral", label: "Viral" },
  { id: "accuracy", label: "Accuracy" },
];

const tabCopy: Record<TalkersTab, string> = {
  overall: "Total reputation across heat, wins, accuracy, and viral receipts.",
  wins: "Talkers stacking the most settled wins.",
  heat: "The loudest takes moving through the arena.",
  viral: "Receipts spreading fastest across the culture.",
  accuracy: "Cleanest hit rate from locked takes.",
};

const podiumTalkers: PodiumTalker[] = [
  {
    rank: 2,
    handle: "@MidRange",
    avatar: "MR",
    heat: "22.4K",
    wins: "118",
    accuracy: "66%",
    viral: "18",
  },
  {
    rank: 1,
    handle: "@TalkHeavy23",
    avatar: "TH",
    heat: "28.6K",
    wins: "142",
    accuracy: "69%",
    viral: "24",
  },
  {
    rank: 3,
    handle: "@BucketsOnly",
    avatar: "BO",
    heat: "20.1K",
    wins: "112",
    accuracy: "64%",
    viral: "16",
  },
];

const talkerRows: TalkerRow[] = [
  {
    rank: 4,
    handle: "@HoopDreams",
    avatar: "HD",
    subtitle: "Crowd Rider",
    badge: "Rising",
    heat: "18.7K",
    wins: "98",
    accuracy: "63%",
    viral: "14",
  },
  {
    rank: 5,
    handle: "@FadeKing",
    avatar: "FK",
    subtitle: "Fade God",
    badge: "Hot",
    heat: "16.9K",
    wins: "93",
    accuracy: "61%",
    viral: "22",
  },
  {
    rank: 6,
    handle: "@NoMercy",
    avatar: "NM",
    subtitle: "No Mercy",
    badge: "Hot",
    heat: "15.2K",
    wins: "87",
    accuracy: "62%",
    viral: "11",
  },
  {
    rank: 7,
    handle: "@PrimeTalker",
    avatar: "PT",
    subtitle: "Prime Time",
    badge: "Steady",
    heat: "13.8K",
    wins: "79",
    accuracy: "60%",
    viral: "9",
  },
  {
    rank: 8,
    handle: "@ClutchCallz",
    avatar: "CC",
    subtitle: "Clutch Calls Only",
    heat: "12.1K",
    wins: "71",
    accuracy: "59%",
    viral: "8",
  },
  {
    rank: 9,
    handle: "@RealDeal",
    avatar: "RD",
    subtitle: "Straight Shooter",
    heat: "11.2K",
    wins: "66",
    accuracy: "58%",
    viral: "7",
  },
  {
    rank: 10,
    handle: "@SharpMind",
    avatar: "SM",
    subtitle: "Numbers Don't Lie",
    badge: "Steady",
    heat: "13.6K",
    wins: "63",
    accuracy: "57%",
    viral: "6",
  },
];

const categoryCards: CategoryCard[] = [
  {
    title: "Heat Kings",
    subtitle: "Bring the most fire.",
    icon: "🔥",
    tone: "heat",
    avatars: ["TH", "MR", "BO"],
  },
  {
    title: "Viral Kings",
    subtitle: "Break the internet.",
    icon: "ϟ",
    tone: "viral",
    avatars: ["FK", "NM", "HD"],
  },
  {
    title: "Clutch Kings",
    subtitle: "Most accurate takes.",
    icon: "◎",
    tone: "clutch",
    avatars: ["HD", "PT", "MR"],
  },
];

export function TopTalkersScreen() {
  const [activeTab, setActiveTab] = useState<TalkersTab>("overall");

  return (
    <div className="space-y-4">
      <TopTalkersHeader />
      <TopTalkersHero />
      <TalkersTabs activeTab={activeTab} onSelect={setActiveTab} />
      <p className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold leading-5 text-gray-400">
        <span className="mr-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
          {activeTab}
        </span>
        {tabCopy[activeTab]}
      </p>
      <Podium />
      <TopTenTable />
      <YourRankCard />
      <CategoryGrid />
    </div>
  );
}

function TopTalkersHeader() {
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

function TopTalkersHero() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(132,204,22,0.2),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(168,85,247,0.22),transparent_34%),linear-gradient(115deg,rgba(255,255,255,0.06),transparent_38%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-purple-950/30 to-transparent" />

      <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-3xl leading-none text-purple-300">♕</p>
          <h2 className="sports-display mt-1 text-[3.25rem] italic leading-[0.85] text-white drop-shadow-[0_6px_20px_rgba(255,255,255,0.12)] min-[390px]:text-[4rem] sm:text-7xl">
            Top Talkers
          </h2>
          <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-gray-200">
            The voices. The takes. The culture.
          </p>
          <div className="mt-3 h-1 w-44 rounded-full bg-gradient-to-r from-lime-300 to-purple-500" />
        </div>

        <div className="rounded-2xl border border-lime-300/20 bg-black/45 p-4 sm:w-44">
          <p className="sports-display text-2xl italic leading-none text-lime-300">Rank Up ↗</p>
          <p className="mt-2 text-sm font-semibold leading-5 text-gray-300">Write takes. Get heat. Climb the board.</p>
          <button
            type="button"
            className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-black/45 px-3 text-xs font-black uppercase text-white transition hover:border-purple-300/50 hover:bg-purple-500/15 active:scale-95"
          >
            All Time⌄
          </button>
        </div>
      </div>
    </section>
  );
}

function TalkersTabs({
  activeTab,
  onSelect,
}: {
  activeTab: TalkersTab;
  onSelect: (tab: TalkersTab) => void;
}) {
  return (
    <nav
      className="grid grid-cols-5 gap-1 rounded-[1.5rem] border border-white/10 bg-black/35 p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur"
      aria-label="Top Talkers views"
    >
      {talkersTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={activeTab === tab.id}
          onClick={() => onSelect(tab.id)}
          className={`min-h-11 rounded-2xl border px-1 text-[9px] font-black uppercase leading-tight transition hover:-translate-y-0.5 active:scale-95 min-[390px]:text-[10px] sm:text-xs ${
            activeTab === tab.id
              ? "border-purple-300/70 bg-gradient-to-b from-purple-500/28 to-purple-500/10 text-white shadow-[0_0_24px_rgba(168,85,247,0.2),inset_0_-2px_0_rgba(168,85,247,0.95)]"
              : "border-transparent text-gray-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function Podium() {
  return (
    <section className="grid gap-3 sm:grid-cols-3 sm:items-end">
      {podiumTalkers.map((talker) => (
        <PodiumCard key={talker.rank} talker={talker} />
      ))}
    </section>
  );
}

function PodiumCard({ talker }: { talker: PodiumTalker }) {
  const isFirst = talker.rank === 1;

  return (
    <article
      className={`relative overflow-hidden rounded-[1.75rem] border bg-black/45 p-3 shadow-[0_20px_58px_rgba(0,0,0,0.36)] transition hover:-translate-y-1 active:scale-[0.985] sm:p-4 ${
        isFirst
          ? "order-first border-lime-300/45 shadow-[0_0_42px_rgba(132,204,22,0.14)] sm:order-none sm:py-5"
          : "border-purple-300/25"
      }`}
    >
      <div
        className={`absolute -left-3 -top-2 sports-display text-[5rem] italic leading-none sm:text-[5.75rem] ${
          isFirst ? "text-lime-400/35" : "text-purple-400/35"
        }`}
      >
        {talker.rank}
      </div>
      {isFirst && <div className="absolute right-5 top-3 text-3xl text-lime-300 sm:text-4xl">♕</div>}

      <div className="relative grid place-items-center text-center">
        <Avatar initials={talker.avatar} size={isFirst ? "large" : "podium"} active={isFirst} />
        <h3 className="mt-2 text-base font-black text-white sm:text-lg">
          {talker.handle} <span className="text-sky-300">◆</span>
        </h3>
        {isFirst && (
          <span className="mt-1.5 rounded-lg border border-lime-300/40 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
            Top Talker
          </span>
        )}

        <p className="scoreboard-number mt-2 text-4xl text-gray-100 sm:text-5xl">
          🔥 {talker.heat}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Heat</p>

        <div className="mt-3 grid w-full grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/35 py-2.5 sm:mt-4">
          <PodiumMetric label="Wins" value={talker.wins} />
          <PodiumMetric label="Accuracy" value={talker.accuracy} />
          <PodiumMetric label="Viral" value={talker.viral} />
        </div>
      </div>
    </article>
  );
}

function PodiumMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 text-center">
      <p className="text-[9px] font-black uppercase text-gray-400">{label}</p>
      <p className="scoreboard-number mt-1 text-xl text-white sm:text-2xl">{value}</p>
    </div>
  );
}

function TopTenTable() {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_52px_rgba(0,0,0,0.36)]">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">
          <span className="mr-2 not-italic text-purple-300">♚</span>
          Top 10 Talkers
        </h2>
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
          Updated live
          <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_14px_rgba(132,204,22,0.8)]" />
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
        <div className="hidden grid-cols-[minmax(0,1fr)_4.25rem_3.5rem_4.25rem_3.25rem] gap-2 border-b border-white/10 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-gray-400 sm:grid">
          <span>Talker</span>
          <span>🔥 Heat</span>
          <span>Wins</span>
          <span>Accuracy</span>
          <span>Viral</span>
        </div>
        {talkerRows.map((talker) => (
          <TalkerTableRow key={talker.rank} talker={talker} />
        ))}
      </div>
    </section>
  );
}

function TalkerTableRow({ talker }: { talker: TalkerRow }) {
  return (
    <article className="grid gap-2.5 border-b border-white/10 px-3 py-2.5 last:border-b-0 transition hover:bg-white/[0.035] sm:grid-cols-[minmax(0,1fr)_4.25rem_3.5rem_4.25rem_3.25rem] sm:items-center">
      <div className="grid min-w-0 grid-cols-[1.75rem_auto_1fr] items-center gap-2.5">
        <span className="scoreboard-number text-xl text-gray-200 sm:text-2xl">{talker.rank}</span>
        <Avatar initials={talker.avatar} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">
            {talker.handle} <span className="text-sky-300">◆</span>
          </p>
          <p className="truncate text-xs font-semibold text-gray-400">
            {talker.subtitle}
            {talker.badge && <Badge label={talker.badge} />}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:contents">
        <TableStat label="Heat" value={`🔥 ${talker.heat}`} tone="text-lime-300" />
        <TableStat label="Wins" value={talker.wins} tone="text-lime-300" />
        <TableStat label="Accuracy" value={talker.accuracy} tone="text-purple-300" />
        <TableStat label="Viral" value={`ϟ ${talker.viral}`} tone="text-purple-300" />
      </div>
    </article>
  );
}

function Badge({ label }: { label: string }) {
  const isRising = label.toLowerCase() === "rising";
  return (
    <span
      className={`ml-2 rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase ${
        isRising
          ? "border-lime-300/35 bg-lime-400/10 text-lime-300"
          : label.toLowerCase() === "steady"
            ? "border-blue-300/35 bg-blue-400/10 text-blue-300"
            : "border-purple-300/35 bg-purple-500/10 text-purple-300"
      }`}
    >
      {label}
    </span>
  );
}

function TableStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-1.5 py-1.5 text-center sm:border-0 sm:bg-transparent sm:p-0 sm:text-left">
      <p className="text-[8px] font-black uppercase text-gray-500 sm:hidden">{label}</p>
      <p className={`mt-0.5 text-xs font-black min-[390px]:text-sm sm:text-base ${tone}`}>{value}</p>
    </div>
  );
}

function YourRankCard() {
  return (
    <section className="rounded-[1.75rem] border border-lime-300/25 bg-lime-400/10 p-4 shadow-[0_0_34px_rgba(132,204,22,0.1)]">
      <div className="grid gap-4 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center">
        <div className="flex items-end justify-between gap-3 sm:block">
          <div>
            <p className="sports-display text-3xl italic leading-none text-lime-300">Your Rank</p>
            <p className="mt-1 text-sm font-black uppercase text-lime-200">Up 5 spots ↑</p>
          </div>
          <p className="hidden rounded-full border border-lime-300/25 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-200 min-[390px]:block sm:hidden">
            In range
          </p>
        </div>

        <Avatar initials="YOU" size="large" active />

        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <p className="scoreboard-number text-5xl text-white">23</p>
          <div className="min-w-0">
            <p className="text-xl font-black text-white">
              @You <span className="text-sky-300">◆</span>
            </p>
            <p className="max-w-[15rem] text-sm font-semibold leading-5 text-gray-300">
              The board is within reach.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center min-[430px]:grid-cols-4 sm:min-w-[21rem]">
          <MiniRankStat label="Heat" value="🔥 4.2K" />
          <MiniRankStat label="Wins" value="24" />
          <MiniRankStat label="Accuracy" value="56%" />
          <MiniRankStat label="Viral" value="3" />
        </div>
      </div>
    </section>
  );
}

function MiniRankStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-2">
      <p className="text-[9px] font-black uppercase text-lime-300">{label}</p>
      <p className="mt-1 text-sm font-black text-white min-[390px]:text-base">{value}</p>
    </div>
  );
}

function CategoryGrid() {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {categoryCards.map((card) => (
        <CategoryPanel key={card.title} card={card} />
      ))}
    </section>
  );
}

function CategoryPanel({ card }: { card: CategoryCard }) {
  const toneClass = {
    heat: "border-lime-300/20 hover:border-lime-300/40",
    viral: "border-purple-300/25 hover:border-purple-300/45",
    clutch: "border-lime-300/20 hover:border-lime-300/40",
  }[card.tone];

  return (
    <button
      type="button"
      className={`rounded-[1.5rem] border bg-black/35 p-4 text-left shadow-[0_18px_48px_rgba(0,0,0,0.34)] transition hover:-translate-y-1 active:scale-[0.985] ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="sports-display text-2xl italic leading-none text-white">
            <span className="mr-2 not-italic">{card.icon}</span>
            {card.title}
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-400">{card.subtitle}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-3xl leading-none text-gray-300">
          ›
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex -space-x-2">
          {card.avatars.map((avatar) => (
            <Avatar key={avatar} initials={avatar} />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">View</span>
      </div>
    </button>
  );
}

function Avatar({
  initials,
  size = "base",
  active = false,
}: {
  initials: string;
  size?: "base" | "podium" | "large";
  active?: boolean;
}) {
  const dimensions =
    size === "large"
      ? "h-[4.5rem] w-[4.5rem] text-sm sm:h-20 sm:w-20"
      : size === "podium"
        ? "h-16 w-16 text-xs"
        : "h-10 w-10 text-[10px] sm:h-11 sm:w-11";

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border bg-gradient-to-br from-lime-300 via-purple-500 to-black font-black text-white shadow-[0_0_18px_rgba(96,165,250,0.16)] ${dimensions} ${
        active ? "border-lime-300/70 shadow-[0_0_30px_rgba(132,204,22,0.28)]" : "border-sky-300/40"
      }`}
    >
      {initials}
    </span>
  );
}
