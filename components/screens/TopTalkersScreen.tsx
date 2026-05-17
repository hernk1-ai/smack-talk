"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LocktLogo } from "@/components/LocktLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { seededProfiles } from "@/data/seededCrowd";
import { getPresenceMeta, getPresenceStatus } from "@/lib/presence";
import { getHeatStatus, getReputationBadges, getReputationLevel } from "@/lib/reputation";
import type { Profile } from "@/lib/supabase/types";

type TalkersTab = "overall" | "wins" | "heat" | "viral" | "accuracy" | "streaks" | "rising" | "search";

type SportFilter = "World Cup";

type PodiumTalker = {
  rank: 1 | 2 | 3;
  handle: string;
  avatar: string;
  levelTitle: string;
  signal: string;
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
  levelTitle: string;
  signal: string;
  streak: number;
  movement: string;
  badgePreview: string;
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
  { id: "streaks", label: "Streaks" },
  { id: "rising", label: "Rising" },
  { id: "search", label: "Search" },
];

const sportFilters: SportFilter[] = ["World Cup"];

const tabCopy: Record<TalkersTab, string> = {
  overall: "Tournament reputation across heat, wins, accuracy, and receipts.",
  wins: "Talkers stacking the most World Cup hits.",
  heat: "The loudest World Cup calls moving through the arena.",
  viral: "Receipts spreading fastest across matchday.",
  accuracy: "Cleanest hit rate from locked World Cup calls.",
  streaks: "Talkers holding form through group and knockout rounds.",
  rising: "Names moving fast before everyone catches on.",
  search: "Find a talker and inspect the receipts behind the reputation.",
};

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

export function TopTalkersScreen({ profile }: { profile?: Profile | null }) {
  const [activeTab, setActiveTab] = useState<TalkersTab>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState<SportFilter>("World Cup");
  const [realProfiles, setRealProfiles] = useState<Profile[]>(profile ? [profile] : []);
  const rankedTalkers = useMemo(
    () => getRankedTalkers(activeTab, activeSport, searchQuery, realProfiles, profile),
    [activeSport, activeTab, profile, realProfiles, searchQuery],
  );
  const podiumRows = useMemo(() => rowsToPodium(rankedTalkers.slice(0, 3)), [rankedTalkers]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfiles() {
      const supabase = createClient();

      if (!supabase) {
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("reputation_score", { ascending: false })
        .order("created_takes_count", { ascending: false })
        .limit(25);

      if (!isMounted) {
        return;
      }

      const profiles = data ?? [];
      const mergedProfiles = profile && !profiles.some((candidate) => candidate.id === profile.id)
        ? [profile, ...profiles]
        : profiles;

      setRealProfiles(mergedProfiles);
    }

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  return (
    <div className="space-y-4">
      <TopTalkersHeader profile={profile} />
      <TopTalkersHero />
      <TalkersTabs activeTab={activeTab} onSelect={setActiveTab} />
      <p className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold leading-5 text-gray-400">
        <span className="mr-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
          {activeTab}
        </span>
        {tabCopy[activeTab]}
      </p>
      <SportFilterSelect value={activeSport} onChange={setActiveSport} />
      <TalkerSearch value={searchQuery} onChange={setSearchQuery} />
      {activeTab === "overall" && !searchQuery.trim() ? <Podium talkers={podiumRows} /> : null}
      <TopTalkersBoard activeTab={activeTab} talkers={rankedTalkers} />
      <CategoryGrid />
    </div>
  );
}

function TopTalkersHeader({ profile }: { profile?: Profile | null }) {
  const username = profile?.username || "LOCKT";

  return (
    <header className="rounded-[1.75rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.36)] backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LocktLogo size={58} />
          <div className="min-w-0">
            <h1 className="brand-lockup text-[2rem] leading-[0.82] sm:text-4xl">
              <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
            </h1>
          </div>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-gray-200">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(132,204,22,0.75)]" />
            12.8K <span className="text-gray-400">Online</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">World Cup calls. Tournament reputation.</p>
        </div>

        <div className="flex items-center gap-2">
          <HeaderIcon label="Notifications" badge="3">
            ♧
          </HeaderIcon>
          <Link
            href="/receipts"
            className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-xl text-white shadow-[0_0_22px_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-purple-300/35 hover:bg-white/[0.07] active:scale-95"
            aria-label={`${username} receipts identity`}
          >
            <UserAvatar avatarUrl={profile?.avatar_url} initials={getInitials(username)} size="sm" />
          </Link>
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
          <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-gray-200">The voices. The calls. The receipts.</p>
          <div className="mt-3 h-1 w-44 rounded-full bg-gradient-to-r from-lime-300 to-purple-500" />
        </div>

        <div className="rounded-2xl border border-lime-300/20 bg-black/45 p-4 sm:w-44">
          <p className="sports-display text-2xl italic leading-none text-lime-300">Rank Up ↗</p>
          <p className="mt-2 text-sm font-semibold leading-5 text-gray-300">Lock calls. Check receipts. Climb the board.</p>
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
      className="grid grid-cols-4 gap-1 rounded-[1.5rem] border border-white/10 bg-black/35 p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur sm:grid-cols-8"
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

function SportFilterSelect({ value, onChange }: { value: SportFilter; onChange: (value: SportFilter) => void }) {
  return (
    <label className="block rounded-[1.25rem] border border-white/10 bg-black/35 p-3 shadow-[0_14px_38px_rgba(0,0,0,0.28)]">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Tournament Scope</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SportFilter)}
        className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white outline-none transition focus:border-purple-300/60 focus:bg-purple-500/10"
      >
        {sportFilters.map((sport) => (
          <option key={sport} value={sport} className="bg-[#090b13]">
            {sport}
          </option>
        ))}
      </select>
    </label>
  );
}

function TalkerSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-[1.25rem] border border-white/10 bg-black/35 p-3 shadow-[0_14px_38px_rgba(0,0,0,0.28)]">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Search Top Talkers</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by username"
        className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white outline-none transition placeholder:text-gray-600 focus:border-purple-300/60 focus:bg-purple-500/10"
      />
    </label>
  );
}

function Podium({ talkers }: { talkers: PodiumTalker[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3 sm:items-end">
      {talkers.map((talker) => (
        <PodiumCard key={talker.rank} talker={talker} />
      ))}
    </section>
  );
}

function PodiumCard({ talker }: { talker: PodiumTalker }) {
  const isFirst = talker.rank === 1;

  return (
    <Link
      href={getReceiptHref(talker.handle)}
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
            {talker.levelTitle}
          </span>
        )}
        <span className={`mt-2 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
          talker.signal === "On Fire"
            ? "border-lime-300/35 bg-lime-400/10 text-lime-300"
            : "border-purple-300/35 bg-purple-500/10 text-purple-200"
        }`}>
          {talker.signal}
        </span>

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
    </Link>
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

function TopTalkersBoard({ activeTab, talkers }: { activeTab: TalkersTab; talkers: TalkerRow[] }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_52px_rgba(0,0,0,0.36)]">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">
          <span className="mr-2 not-italic text-purple-300">♚</span>
          Top Talkers Board
        </h2>
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
          {activeTab === "search" ? "Search results" : "Updated live"}
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
        {talkers.map((talker) => (
          <TalkerTableRow key={talker.handle} talker={talker} />
        ))}
      </div>
    </section>
  );
}

function TalkerTableRow({ talker }: { talker: TalkerRow }) {
  const presence = getPresenceMeta(getPresenceStatus(talker.handle));

  return (
    <Link href={getReceiptHref(talker.handle)} className="grid gap-2.5 border-b border-white/10 px-3 py-2.5 last:border-b-0 transition hover:bg-white/[0.035] sm:grid-cols-[minmax(0,1fr)_4.25rem_3.5rem_4.25rem_3.25rem] sm:items-center">
      <div className="grid min-w-0 grid-cols-[1.75rem_auto_1fr] items-center gap-2.5">
        <span className="scoreboard-number text-xl text-gray-200 sm:text-2xl">{talker.rank}</span>
        <Avatar initials={talker.avatar} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">
            {talker.handle} <span className="text-sky-300">◆</span>
          </p>
          <p className="truncate text-xs font-semibold text-gray-400">
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${presence.className}`} />
            <span className={`mr-1.5 font-black uppercase ${presence.textClassName}`}>{presence.label}</span>
            {talker.subtitle}
            {talker.badge && <Badge label={talker.badge} />}
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-gray-500">
            <span className="rounded-md border border-lime-300/20 bg-lime-400/5 px-1.5 py-0.5 text-lime-300">{talker.levelTitle}</span>
            <span className="rounded-md border border-purple-300/20 bg-purple-500/5 px-1.5 py-0.5 text-purple-300">{talker.signal}</span>
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5">{talker.movement}</span>
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5">{talker.badgePreview}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:contents">
        <TableStat label="Heat" value={`🔥 ${talker.heat}`} tone="text-lime-300" />
        <TableStat label="Wins" value={talker.wins} tone="text-lime-300" />
        <TableStat label="Accuracy" value={talker.accuracy} tone="text-purple-300" />
        <TableStat label="Viral" value={`ϟ ${talker.viral}`} tone="text-purple-300" />
      </div>
    </Link>
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

function getRankedTalkers(
  activeTab: TalkersTab,
  activeSport: SportFilter,
  searchQuery: string,
  realProfiles: Profile[],
  currentProfile?: Profile | null,
): TalkerRow[] {
  const realRows = profilesToTalkers(realProfiles, currentProfile);
  const seededRows = seededProfilesToTalkers().filter(
    (talker) => !realRows.some((realTalker) => realTalker.handle.toLowerCase() === talker.handle.toLowerCase()),
  );
  const combinedTalkers: TalkerRow[] = [
    ...realRows,
    ...seededRows,
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const sportFilteredTalkers = combinedTalkers.filter((talker) => getTalkerSport(talker.handle) === activeSport);

  const filteredTalkers = normalizedQuery
    ? sportFilteredTalkers.filter((talker) => `${talker.handle} ${talker.subtitle}`.toLowerCase().includes(normalizedQuery))
    : sportFilteredTalkers;

  const metric = activeTab === "search" ? "overall" : activeTab;

  return [...filteredTalkers]
    .sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric))
    .map((talker, index) => ({ ...talker, rank: index + 1 }));
}

function profilesToTalkers(realProfiles: Profile[], currentProfile?: Profile | null): TalkerRow[] {
  const profiles = [...realProfiles].sort((left, right) => {
    if (right.reputation_score !== left.reputation_score) {
      return right.reputation_score - left.reputation_score;
    }

    return right.created_takes_count - left.created_takes_count;
  });

  return profiles.map((realProfile, index) => {
    const wins = realProfile.hits_count ?? 0;
    const losses = realProfile.misses_count ?? 0;
    const total = wins + losses;
    const accuracy = total ? `${Math.round((wins / total) * 100)}%` : "0%";
    const isCurrentUser = currentProfile?.id === realProfile.id;
    const reputation = realProfile.reputation_score ?? realProfile.reputation ?? 0;
    const activityCount = (realProfile.created_takes_count ?? 0) + (realProfile.receipts_count ?? 0);
    const level = getReputationLevel(reputation, activityCount);
    const signal = getHeatStatus({ heat: reputation, reputation, streak: wins >= 3 ? 3 : 0 }).label;
    const earnedBadge = getReputationBadges({
      reputation,
      wins,
      losses,
      takes: realProfile.created_takes_count ?? 0,
      receipts: realProfile.receipts_count ?? 0,
      streak: wins >= 3 ? 3 : 0,
      heat: reputation,
      rank: index + 1,
    }).find((badgeItem) => badgeItem.earned);

    return {
      rank: index + 1,
      handle: `@${(realProfile.username || (isCurrentUser ? "You" : "Talker")).replace(/^@/, "")}`,
      avatar: getInitials(realProfile.username || "ST"),
      subtitle: isCurrentUser ? "Your record" : `${formatCompact(realProfile.receipts_count ?? 0)} receipts`,
      badge: isCurrentUser ? "You" : realProfile.created_takes_count > 0 ? "Rising" : undefined,
      levelTitle: level.title,
      signal,
      streak: wins >= 3 ? 3 : 0,
      movement: realProfile.created_takes_count > 0 ? "Rising" : "New",
      badgePreview: earnedBadge?.name ?? "No badge yet",
      heat: formatCompact(reputation),
      wins: String(wins),
      accuracy,
      viral: formatCompact(realProfile.created_takes_count ?? 0),
    };
  });
}

function seededProfilesToTalkers(): TalkerRow[] {
  return seededProfiles.map((profile, index) => {
    const level = getReputationLevel(profile.reputation_score, profile.created_takes_count);
    const signal = getHeatStatus({ heat: profile.heat, reputation: profile.reputation_score, streak: profile.streak }).label;
    const earnedBadge = getReputationBadges({
      reputation: profile.reputation_score,
      wins: profile.wins,
      losses: profile.losses,
      takes: profile.created_takes_count,
      receipts: profile.wins + profile.losses,
      streak: profile.streak,
      heat: profile.heat,
      rank: index + 1,
    }).find((badgeItem) => badgeItem.earned);

    return {
      rank: index + 1,
      handle: `@${profile.username}`,
      avatar: profile.avatar,
      subtitle: profile.title,
      badge: profile.username === "TalkHeavy23" || profile.username === "HoopDreams" ? "Rising" : profile.streak >= 6 ? "Hot" : undefined,
      levelTitle: level.title,
      signal,
      streak: profile.streak,
      movement: profile.streak >= 6 ? "Up fast" : profile.streak >= 3 ? "Holding" : "Steady",
      badgePreview: earnedBadge?.name ?? "No badge yet",
      heat: formatCompact(profile.heat),
      wins: String(profile.wins),
      accuracy: `${profile.hit_rate}%`,
      viral: String(profile.viral),
    };
  });
}

function rowsToPodium(rows: TalkerRow[]): PodiumTalker[] {
  const fallbackRows = getRankedTalkers("overall", "World Cup", "", [], null).slice(0, 3);
  const podiumSource = rows.length >= 3 ? rows : fallbackRows;

  return podiumSource.slice(0, 3).map((row, index) => ({
    rank: (index + 1) as 1 | 2 | 3,
    handle: row.handle,
    avatar: row.avatar,
    levelTitle: row.levelTitle,
    signal: row.signal,
    heat: row.heat,
    wins: row.wins,
    accuracy: row.accuracy,
    viral: row.viral,
  }));
}


function getTalkerSport(handle: string): SportFilter {
  void handle;
  return "World Cup";
}

function getMetricValue(talker: TalkerRow, metric: Exclude<TalkersTab, "search">) {
  if (metric === "wins") return parseCompactNumber(talker.wins);
  if (metric === "heat" || metric === "overall") return parseCompactNumber(talker.heat);
  if (metric === "viral") return parseCompactNumber(talker.viral);
  if (metric === "accuracy") return Number(talker.accuracy.replace("%", ""));
  if (metric === "streaks") return talker.streak;
  if (metric === "rising") return talker.movement.toLowerCase().includes("up") || talker.badge?.toLowerCase() === "rising" ? 1000 - talker.rank : 100 - talker.rank;
  return talker.rank;
}

function parseCompactNumber(value: string) {
  const normalized = value.toUpperCase();
  const numeric = Number(normalized.replace(/[^0-9.]/g, ""));
  return normalized.includes("K") ? numeric * 1000 : numeric;
}

function formatCompact(value: number) {
  if (value >= 1000000) {
    return `${Number((value / 1000000).toFixed(1))}M`;
  }

  if (value >= 1000) {
    return `${Number((value / 1000).toFixed(1))}K`;
  }

  return String(value);
}

function getReceiptHref(handle: string) {
  return `/receipts/${handle.replace(/^@/, "").toLowerCase()}`;
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

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}
