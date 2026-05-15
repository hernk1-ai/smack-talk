"use client";

import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { ACTIVE_GAME_ID } from "@/lib/supabase/games";
import {
  attachAuthorToTake,
  formatTakeForUI,
  getFeaturedTakeFromList,
  getTrendingTakesFromList,
  isSeededTakeId,
  mergeArenaFeedWithSeeded,
  refreshArenaData,
  type ArenaTake,
} from "@/lib/supabase/arena";
import { reactToTake } from "@/lib/supabase/reactions";
import { createLockedTake } from "@/lib/supabase/takes";
import { seededChaosAlerts } from "@/data/seededCrowd";
import type { Game, Profile, TakeReaction } from "@/lib/supabase/types";

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
  tone: "green" | "purple" | "red";
};

const featuredHotTake = {
  matchup: "LAL vs GSW",
  status: "Live",
  period: "4th QTR · 2:47",
  watching: "12.8K watching",
  handle: "@BucketsOnly",
  avatar: "BO",
  text: "LAL closing this. Warriors cooked.",
  heat: "3.6K",
  rides: "2.1K",
  fades: "842",
  score: "LAL 108 — 103 GSW",
  movement: "LAL +21% last 5 min",
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

export function FeedScreen({ onEnterArena, profile }: { onEnterArena: () => void; profile?: Profile | null }) {
  const router = useRouter();
  const [takeChoices, setTakeChoices] = useState<Record<string, Side>>({});
  const [featuredChoice, setFeaturedChoice] = useState<Side | null>(null);
  const [lockedTake, setLockedTake] = useState("");
  const [lockTakeStatus, setLockTakeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lockTakeMessage, setLockTakeMessage] = useState("");
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [gameTakes, setGameTakes] = useState<ArenaTake[]>([]);
  const [takeReactions, setTakeReactions] = useState<Record<string, TakeReaction["reaction"]>>({});
  const [reactionLoadingTakeId, setReactionLoadingTakeId] = useState<string | null>(null);
  const [reactionMessage, setReactionMessage] = useState("");
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const featuredTake = getFeaturedTakeFromList(gameTakes);
  const trendingRealTakes = getTrendingTakesFromList(gameTakes, 4);
  const combinedReactions = { ...takeChoices, ...takeReactions } as Record<string, TakeReaction["reaction"]>;
  const dynamicChaosAlerts = buildChaosAlerts(gameTakes);

  useEffect(() => {
    let isMounted = true;

    async function loadArenaData() {
      const { game, feed, reactionMap } = await refreshArenaData(ACTIVE_GAME_ID);

      if (!isMounted) {
        return;
      }

      setActiveGame(game);
      const mergedFeed = mergeArenaFeedWithSeeded(feed, game?.id ?? ACTIVE_GAME_ID);
      setGameTakes(mergedFeed);
      setTakeReactions(reactionMap);
      setRecentActivity(
        mergedFeed.slice(0, 4).map((take) => `${formatTakeForUI(take).handle} locked a take`),
      );
    }

    loadArenaData();

    return () => {
      isMounted = false;
    };
  }, []);

  function chooseTake(id: string, side: Side) {
    setTakeChoices((current) => ({ ...current, [id]: side }));
  }

  async function lockTake() {
    setLockTakeStatus("loading");
    setLockTakeMessage("");

    const { take, error } = await createLockedTake({
      gameId: activeGame?.id ?? ACTIVE_GAME_ID,
      takeText: lockedTake,
    });

    if (error) {
      setLockTakeStatus("error");
      setLockTakeMessage(error.message);
      return;
    }

    setLockedTake("");
    if (take) {
      const arenaTake = attachAuthorToTake(take, profile);
      setGameTakes((currentTakes) => [arenaTake, ...currentTakes]);
      setRecentActivity((currentActivity) =>
        [`${formatTakeForUI(arenaTake).handle} locked a take`, ...currentActivity].slice(0, 4),
      );
    }
    setLockTakeStatus("success");
    setLockTakeMessage("Locked. No switching sides.");
  }

  async function reactToLockedTake(takeId: string, reaction: Side) {
    setReactionLoadingTakeId(takeId);
    setReactionMessage("");

    if (isSeededTakeId(takeId)) {
      setGameTakes((currentTakes) =>
        currentTakes.map((take) => {
          if (take.id !== takeId) {
            return take;
          }

          const previousReaction = takeChoices[takeId];

          if (previousReaction === reaction) {
            return take;
          }

          const nextRideCount = Math.max(take.ride_count + (reaction === "ride" ? 1 : 0) - (previousReaction === "ride" ? 1 : 0), 0);
          const nextFadeCount = Math.max(take.fade_count + (reaction === "fade" ? 1 : 0) - (previousReaction === "fade" ? 1 : 0), 0);

          return {
            ...take,
            ride_count: nextRideCount,
            fade_count: nextFadeCount,
            heat: nextRideCount + nextFadeCount + take.reply_count * 2,
          };
        }),
      );
      setTakeChoices((currentChoices) => ({ ...currentChoices, [takeId]: reaction }));
      const reactedTake = gameTakes.find((take) => take.id === takeId);
      const activityHandle = reactedTake ? formatTakeForUI(reactedTake).handle : "@TheCrowd";
      setRecentActivity((currentActivity) =>
        [`You ${reaction === "ride" ? "rode" : "faded"} ${activityHandle}`, ...currentActivity].slice(0, 4),
      );
      setReactionLoadingTakeId(null);
      return;
    }

    const { reaction: savedReaction, take, error } = await reactToTake({ takeId, reaction });

    if (error) {
      setReactionMessage(error.message);
      setReactionLoadingTakeId(null);
      return;
    }

    if (savedReaction) {
      setTakeReactions((currentReactions) => ({
        ...currentReactions,
        [takeId]: savedReaction.reaction,
      }));
    }

    if (take) {
      const existingTake = gameTakes.find((currentTake) => currentTake.id === take.id);
      const updatedTake = { ...take, author: existingTake?.author ?? null };

      setGameTakes((currentTakes) =>
        currentTakes.map((currentTake) => (currentTake.id === take.id ? updatedTake : currentTake)),
      );

      if (savedReaction) {
        const activityHandle = formatTakeForUI(updatedTake).handle;
        setRecentActivity((currentActivity) =>
          [`You ${savedReaction.reaction === "ride" ? "rode" : "faded"} ${activityHandle}`, ...currentActivity].slice(0, 4),
        );
      }
    }

    setReactionLoadingTakeId(null);
  }

  function openTakeThread(takeId: string) {
    router.push(`/take/${takeId}`);
  }

  return (
    <div className="space-y-5">
      <FeedHeader profile={profile} />
      <FeaturedHotTakeCard
        game={activeGame}
        take={featuredTake}
        onJoinLive={onEnterArena}
        onOpenTake={featuredTake ? () => openTakeThread(featuredTake.id) : undefined}
      />
      <FeaturedRideFade
        loading={featuredTake ? reactionLoadingTakeId === featuredTake.id : false}
        selected={featuredTake ? combinedReactions[featuredTake.id] ?? null : featuredChoice}
        take={featuredTake}
        onChoose={(side) => {
          if (featuredTake) {
            reactToLockedTake(featuredTake.id, side);
            return;
          }

          setFeaturedChoice(side);
        }}
      />
      <LockTakeComposer
        value={lockedTake}
        status={lockTakeStatus}
        message={lockTakeMessage}
        lockedCount={gameTakes.length}
        onChange={(value) => {
          setLockedTake(value);
          if (lockTakeStatus !== "loading") {
            setLockTakeStatus("idle");
            setLockTakeMessage("");
          }
        }}
        onLock={lockTake}
      />
      <LiveLockedTakes
        takes={gameTakes}
        reactions={combinedReactions}
        loadingTakeId={reactionLoadingTakeId}
        message={reactionMessage}
        onOpenTake={openTakeThread}
        onReact={reactToLockedTake}
      />
      <RecentActivityPulse activity={recentActivity} />
      <TrendingTakes
        choices={takeChoices}
        loadingTakeId={reactionLoadingTakeId}
        reactions={combinedReactions}
        realTakes={trendingRealTakes}
        onChoose={chooseTake}
        onOpenTake={openTakeThread}
        onReact={reactToLockedTake}
      />
      <LiveArenas onEnterArena={onEnterArena} />
      <ChaosAlerts alerts={dynamicChaosAlerts} />
    </div>
  );
}

function FeedHeader({ profile }: { profile?: Profile | null }) {
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
          <Link
            href="/receipts"
            className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-2xl text-purple-300 shadow-[0_0_24px_rgba(168,85,247,0.14)] transition active:scale-95"
            aria-label={`${username} profile avatar`}
          >
            <UserAvatar avatarUrl={profile?.avatar_url} initials={getInitials(username)} size="sm" />
          </Link>
        </div>
      </div>
    </header>
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

function getReceiptHref(handle: string) {
  return `/receipts/${handle.replace(/^@/, "").toLowerCase()}`;
}

function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, onOpen?: () => void) {
  if (!onOpen) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatGameStatus(status: Game["status"]) {
  if (status === "live") {
    return "Live";
  }

  if (status === "final") {
    return "Final";
  }

  return "Scheduled";
}

function FeaturedHotTakeCard({
  game,
  take,
  onJoinLive,
  onOpenTake,
}: {
  game: Game | null;
  take: ArenaTake | null;
  onJoinLive: () => void;
  onOpenTake?: () => void;
}) {
  const matchup = game ? `${game.away_team} vs ${game.home_team}` : featuredHotTake.matchup;
  const period = game ? [game.period, game.clock].filter(Boolean).join(" · ") : featuredHotTake.period;
  const watching = game ? `${formatCompact(game.watching_count)} watching` : featuredHotTake.watching;
  const score = game
    ? `${game.away_team} ${game.away_score} — ${game.home_score} ${game.home_team}`
    : featuredHotTake.score;
  const heat = take ? formatCompact(take.heat) : game ? formatCompact(game.heat) : featuredHotTake.heat;
  const rides = take ? formatCompact(take.ride_count) : game ? formatCompact(game.ride_count) : featuredHotTake.rides;
  const fades = take ? formatCompact(take.fade_count) : game ? formatCompact(game.fade_count) : featuredHotTake.fades;
  const replies = take ? formatCompact(take.reply_count) : "0";
  const status = game ? formatGameStatus(game.status) : featuredHotTake.status;
  const author = take ? formatTakeForUI(take) : null;
  const handle = author?.handle ?? featuredHotTake.handle;
  const avatar = author?.initials ?? featuredHotTake.avatar;
  const avatarUrl = author?.avatarUrl ?? null;
  const takeText = take?.take_text ?? featuredHotTake.text;

  return (
    <section className="arena-scoreboard overflow-hidden rounded-[1.75rem] border border-lime-300/25 p-4 shadow-[0_26px_80px_rgba(0,0,0,0.56),0_0_34px_rgba(132,204,22,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-lime-300">
          <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(132,204,22,0.75)]" />
          Hottest Live Take
        </p>
        <span className="rounded-md border border-red-400/60 bg-red-500/10 px-2.5 py-1 text-xs font-black uppercase text-red-300">
          ▷ {status}
        </span>
      </div>

      <div
        role={onOpenTake ? "button" : undefined}
        tabIndex={onOpenTake ? 0 : undefined}
        onClick={onOpenTake}
        onKeyDown={(event) => handleCardKeyDown(event, onOpenTake)}
        className={`mt-4 rounded-2xl border border-white/10 bg-black/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
          onOpenTake ? "cursor-pointer transition hover:border-lime-300/25 hover:bg-black/60" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">{matchup}</p>
            <p className="mt-1 text-xs font-black uppercase text-purple-300">{period}</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onJoinLive();
            }}
            className="min-h-9 rounded-xl border border-purple-300/60 bg-purple-500/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-purple-200 transition hover:bg-purple-500/15 active:scale-[0.98]"
          >
            Join Live
          </button>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <Link
            href={getReceiptHref(handle)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`${handle} receipts`}
            className="rounded-full transition hover:scale-105 active:scale-95"
          >
            <UserAvatar avatarUrl={avatarUrl} initials={avatar} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={getReceiptHref(handle)}
                onClick={(event) => event.stopPropagation()}
                className="text-sm font-black text-white transition hover:text-lime-200"
              >
                {handle}
              </Link>
              <span className="text-sky-300">◆</span>
              <p className="text-xs font-bold text-gray-500">{watching}</p>
            </div>
            <h2 className="mt-2 text-3xl font-black italic leading-tight text-white sm:text-4xl">
              {takeText}
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/45 p-3 text-center">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500">Heat</p>
              <p className="mt-1 text-lg font-black text-lime-300">🔥 {heat}</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-[10px] font-black uppercase text-gray-500">Riding</p>
              <p className="mt-1 text-lg font-black text-lime-300">{rides}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500">Fading</p>
              <p className="mt-1 text-lg font-black text-purple-300">{fades}</p>
            </div>
            <div className="border-l border-white/10">
              <p className="text-[10px] font-black uppercase text-gray-500">Replies</p>
              <p className="mt-1 text-lg font-black text-white">{replies}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/45 p-3 sm:min-w-48 sm:text-right">
            <p className="text-[10px] font-black uppercase text-gray-500">Game context</p>
            <p className="mt-1 text-sm font-black text-white">{score}</p>
            <p className="mt-1 text-xs font-black uppercase text-lime-300">{featuredHotTake.movement}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedRideFade({
  loading = false,
  selected,
  take,
  onChoose,
}: {
  loading?: boolean;
  selected: Side | null;
  take: ArenaTake | null;
  onChoose: (side: Side) => void;
}) {
  const rideCount = take ? formatCompact(take.ride_count) : featuredHotTake.rides;
  const fadeCount = take ? formatCompact(take.fade_count) : featuredHotTake.fades;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Pick a side</p>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Reaction, not a lock</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ReactionButton
          side="ride"
          count={rideCount}
          active={selected === "ride"}
          disabled={loading}
          onClick={() => onChoose("ride")}
        />
        <ReactionButton
          side="fade"
          count={fadeCount}
          active={selected === "fade"}
          disabled={loading}
          onClick={() => onChoose("fade")}
        />
      </div>
    </section>
  );
}

function ReactionButton({
  side,
  count,
  active,
  disabled = false,
  onClick,
}: {
  side: Side;
  count: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isRide = side === "ride";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-h-16 rounded-2xl border px-4 text-left transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 ${
        isRide
          ? active
            ? "border-lime-300 bg-lime-400 text-black shadow-[0_0_28px_rgba(132,204,22,0.26)]"
            : "border-lime-300/45 bg-lime-400/8 text-lime-300 hover:bg-lime-400/12"
          : active
            ? "border-purple-300 bg-purple-500 text-white shadow-[0_0_28px_rgba(168,85,247,0.3)]"
            : "border-purple-300/55 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15"
      }`}
    >
      <span className="block text-xl font-black uppercase tracking-[0.12em]">{isRide ? "Ride" : "Fade"}</span>
      <span className={`mt-1 block text-xs font-black uppercase ${active ? "opacity-80" : "text-gray-400"}`}>
        {count} {isRide ? "riding" : "fading"}
      </span>
    </button>
  );
}

function LockTakeComposer({
  value,
  status,
  message,
  lockedCount,
  onChange,
  onLock,
}: {
  value: string;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  lockedCount: number;
  onChange: (value: string) => void;
  onLock: () => void;
}) {
  const isLockedDisabled = status === "loading" || value.trim().length === 0;

  return (
    <section className="rounded-[1.75rem] border border-purple-300/30 bg-purple-500/10 p-4 shadow-[0_0_34px_rgba(168,85,247,0.14)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">Lock Take</p>
          <h2 className="sports-display mt-1 text-2xl italic leading-none text-white">Put your name on it.</h2>
        </div>
        <span className="rounded-full border border-lime-300/25 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase text-lime-300">
          {lockedCount} Arena locks
        </span>
      </div>

      <label className="sr-only" htmlFor="arena-lock-take">
        Say it with your chest
      </label>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-stretch">
        <div className="relative">
          <textarea
            id="arena-lock-take"
            value={value}
            maxLength={150}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Say it with your chest..."
            className="min-h-24 w-full resize-none rounded-2xl border border-purple-300/45 bg-black/55 px-4 py-4 pr-16 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-lime-300/60 focus:shadow-[0_0_24px_rgba(132,204,22,0.12)] md:min-h-16"
          />
          <span className="absolute bottom-3 right-4 text-xs font-bold text-gray-500">{value.length}/150</span>
        </div>
        <button
          type="button"
          onClick={onLock}
          disabled={isLockedDisabled}
          className="min-h-14 rounded-2xl border border-purple-300/60 bg-purple-500/15 px-6 text-sm font-black uppercase tracking-[0.12em] text-purple-100 shadow-[0_0_24px_rgba(168,85,247,0.14)] transition hover:-translate-y-0.5 hover:bg-purple-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {status === "loading" ? "Locking..." : "Lock Take 🔒"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.1em] ${
            status === "error"
              ? "border-red-400/35 bg-red-500/10 text-red-200"
              : "border-lime-300/30 bg-lime-400/10 text-lime-300"
          }`}
        >
          {message}
        </p>
      )}

      <div className="mt-3 grid gap-2 text-xs font-semibold text-gray-400 sm:grid-cols-2">
        <p>Locked &amp; permanent. Everyone will see this.</p>
        <p>No switching sides. Receipts don&apos;t lie.</p>
      </div>
    </section>
  );
}

function LiveLockedTakes({
  takes,
  reactions,
  loadingTakeId,
  message,
  onOpenTake,
  onReact,
}: {
  takes: ArenaTake[];
  reactions: Record<string, TakeReaction["reaction"]>;
  loadingTakeId: string | null;
  message: string;
  onOpenTake: (takeId: string) => void;
  onReact: (takeId: string, reaction: Side) => void;
}) {
  if (!takes.length) {
    return null;
  }

  return (
    <FeedSection title="Live Locked Takes" icon="ϟ" action={`${takes.length} live`}>
      <div className="space-y-3">
        {message && (
          <p className="rounded-2xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-red-200">
            {message}
          </p>
        )}
        {takes.map((take) => {
          const activeReaction = reactions[take.id];
          const isLoading = loadingTakeId === take.id;
          const { avatarUrl, handle, initials } = formatTakeForUI(take);

          return (
            <article
              key={take.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenTake(take.id)}
              onKeyDown={(event) => handleCardKeyDown(event, () => onOpenTake(take.id))}
              className="cursor-pointer rounded-2xl border border-white/10 bg-black/45 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.3)] transition hover:border-lime-300/20 hover:bg-black/55"
            >
              <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
                <Link
                  href={getReceiptHref(handle)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`${handle} receipts`}
                  className="rounded-full transition hover:scale-105 active:scale-95"
                >
                  <UserAvatar avatarUrl={avatarUrl} initials={initials} size="sm" />
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={getReceiptHref(handle)}
                      onClick={(event) => event.stopPropagation()}
                      className="truncate text-sm font-black text-white transition hover:text-lime-200"
                    >
                      {handle}
                    </Link>
                    <span className="text-sky-300">◆</span>
                    <span className="text-xs font-bold text-gray-500">{formatTakeAge(take.created_at)}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-black leading-tight text-white">{take.take_text}</h3>
                </div>
                <span className="rounded-full border border-purple-300/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-purple-200">
                  {take.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/45 p-2 text-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500">Heat</p>
                  <p className="mt-1 text-sm font-black text-lime-300">🔥 {formatCompact(take.heat)}</p>
                </div>
                <div className="border-x border-white/10">
                  <p className="text-[10px] font-black uppercase text-gray-500">Riding</p>
                  <p className="mt-1 text-sm font-black text-lime-300">{formatCompact(take.ride_count)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500">Fading</p>
                  <p className="mt-1 text-sm font-black text-purple-300">{formatCompact(take.fade_count)}</p>
                </div>
                <div className="border-l border-white/10">
                  <p className="text-[10px] font-black uppercase text-gray-500">Replies</p>
                  <p className="mt-1 text-sm font-black text-white">{formatCompact(take.reply_count)}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <LockedTakeReactionButton
                  active={activeReaction === "ride"}
                  count={take.ride_count}
                  disabled={isLoading}
                  side="ride"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReact(take.id, "ride");
                  }}
                />
                <LockedTakeReactionButton
                  active={activeReaction === "fade"}
                  count={take.fade_count}
                  disabled={isLoading}
                  side="fade"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReact(take.id, "fade");
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </FeedSection>
  );
}

function LockedTakeReactionButton({
  active,
  count,
  disabled,
  side,
  onClick,
}: {
  active: boolean;
  count: number;
  disabled: boolean;
  side: Side;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const isRide = side === "ride";

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-3 text-left transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 ${
        isRide
          ? active
            ? "border-lime-300 bg-lime-400 text-black shadow-[0_0_22px_rgba(132,204,22,0.26)]"
            : "border-lime-300/45 bg-lime-400/8 text-lime-300 hover:bg-lime-400/12"
          : active
            ? "border-purple-300 bg-purple-500 text-white shadow-[0_0_22px_rgba(168,85,247,0.28)]"
            : "border-purple-300/55 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15"
      }`}
    >
      <span className="block text-sm font-black uppercase tracking-[0.12em]">{isRide ? "Ride" : "Fade"}</span>
      <span className={`mt-0.5 block text-[10px] font-black uppercase ${active ? "opacity-80" : "text-gray-400"}`}>
        {formatCompact(count)} {isRide ? "riding" : "fading"}
      </span>
    </button>
  );
}

function formatTakeAge(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function RecentActivityPulse({ activity }: { activity: string[] }) {
  if (!activity.length) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-lime-300/15 bg-black/30 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.3)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_14px_rgba(132,204,22,0.7)]" />
          Arena Pulse
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Live movement</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {activity.map((item, index) => (
          <div key={`${item}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="truncate text-xs font-bold text-gray-300">
              <span className="mr-2 text-purple-300">ϟ</span>
              {item}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingTakes({
  choices,
  loadingTakeId,
  reactions,
  realTakes,
  onChoose,
  onOpenTake,
  onReact,
}: {
  choices: Record<string, Side>;
  loadingTakeId: string | null;
  reactions: Record<string, TakeReaction["reaction"]>;
  realTakes: ArenaTake[];
  onChoose: (id: string, side: Side) => void;
  onOpenTake: (takeId: string) => void;
  onReact: (takeId: string, reaction: Side) => void;
}) {
  const fallbackTakes = trendingTakes.slice(0, Math.max(0, 4 - realTakes.length));

  return (
    <FeedSection title="Trending Takes" icon="🔥" action="See all">
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {realTakes.map((take, index) => {
          const { avatarUrl, handle, initials } = formatTakeForUI(take);
          const activeReaction = reactions[take.id];
          const isLoading = loadingTakeId === take.id;

          return (
            <article
              key={take.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenTake(take.id)}
              onKeyDown={(event) => handleCardKeyDown(event, () => onOpenTake(take.id))}
              className="premium-card min-w-[10.25rem] cursor-pointer snap-start rounded-2xl border border-white/10 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.34)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-lime-400 text-xs font-black text-black">
                    {index + 1}
                  </span>
                  <Link
                    href={getReceiptHref(handle)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`${handle} receipts`}
                    className="rounded-full transition hover:scale-105 active:scale-95"
                  >
                    <UserAvatar avatarUrl={avatarUrl} initials={initials} size="sm" />
                  </Link>
                </div>
              </div>
              <Link
                href={getReceiptHref(handle)}
                onClick={(event) => event.stopPropagation()}
                className="mt-3 block truncate text-[11px] font-black text-gray-200 transition hover:text-lime-200"
              >
                {handle} <span className="text-sky-300">◆</span>
              </Link>
              <p className="text-[10px] font-bold text-gray-500">{formatTakeAge(take.created_at)}</p>
              <h3 className="mt-3 min-h-14 text-xl font-black leading-tight text-white">{take.take_text}</h3>
              <p className="mt-3 text-sm font-black text-lime-300">
                🔥 {formatCompact(take.heat)} <span className="text-xs uppercase text-gray-500">Heat</span>
              </p>
              <div className="mt-3 flex items-center justify-between text-sm font-black">
                <span className="text-lime-300">👍 {formatCompact(take.ride_count)}</span>
                <span className="text-purple-300">👎 {formatCompact(take.fade_count)}</span>
                <span className="text-gray-300">▣ {formatCompact(take.reply_count)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <TakeButton
                  active={activeReaction === "ride"}
                  disabled={isLoading}
                  side="ride"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReact(take.id, "ride");
                  }}
                />
                <TakeButton
                  active={activeReaction === "fade"}
                  disabled={isLoading}
                  side="fade"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReact(take.id, "fade");
                  }}
                />
              </div>
            </article>
          );
        })}
        {fallbackTakes.map((take, index) => (
          <article
            key={take.id}
            className="premium-card min-w-[10.25rem] snap-start rounded-2xl border border-white/10 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.34)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-lime-400 text-xs font-black text-black">
                  {realTakes.length + index + 1}
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-lime-300 via-purple-500 to-black text-[10px] font-black text-white">
                  {take.avatar}
                </span>
              </div>
            </div>
            <Link
              href={getReceiptHref(take.handle)}
              className="mt-3 block truncate text-[11px] font-black text-gray-200 transition hover:text-lime-200"
            >
              {take.handle} {take.verified && <span className="text-sky-300">◆</span>}
            </Link>
            <p className="text-[10px] font-bold text-gray-500">{take.timestamp}</p>
            <h3 className="mt-3 min-h-14 text-xl font-black leading-tight text-white">{take.text}</h3>
            <p className="mt-3 text-sm font-black text-lime-300">🔥 {take.heat} <span className="text-xs uppercase text-gray-500">Heat</span></p>
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
                <span className="text-lime-300">🔥 {arena.heat} Heat</span>
                <span className={arena.trendDirection === "up" ? "text-lime-300" : "text-purple-300"}>
                  {arena.trend} {arena.trendDirection === "up" ? "↑" : "↓"}
                </span>
              </div>
              <button
                type="button"
                onClick={onEnterArena}
                className="mt-4 min-h-11 w-full rounded-xl border border-lime-300/30 bg-lime-400/5 text-sm font-black uppercase text-lime-300 transition active:scale-[0.98]"
              >
                Join Live
              </button>
            </article>
          );
        })}
      </div>
    </FeedSection>
  );
}

function ChaosAlerts({ alerts }: { alerts: ChaosAlert[] }) {
  return (
    <FeedSection title="Chaos Alerts" icon="▴" action="See all">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
        {alerts.map((alert) => (
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

function buildChaosAlerts(takes: ArenaTake[]): ChaosAlert[] {
  const hottestTake = getFeaturedTakeFromList(takes);
  const generatedAlerts: ChaosAlert[] = [];

  if (hottestTake) {
    const totalReactions = hottestTake.ride_count + hottestTake.fade_count;
    const ridePercent = totalReactions ? Math.round((hottestTake.ride_count / totalReactions) * 100) : 0;
    const fadePercent = totalReactions ? 100 - ridePercent : 0;
    const handle = formatTakeForUI(hottestTake).handle;

    if (totalReactions > 0) {
      generatedAlerts.push({
        id: `hot-split-${hottestTake.id}`,
        icon: "◎",
        title: `${Math.max(ridePercent, fadePercent)}% ${ridePercent >= fadePercent ? "rode" : "faded"} ${handle}.`,
        detail: ridePercent >= fadePercent ? "Fade opportunity?" : "Ride side under pressure.",
        time: "live",
        tone: ridePercent >= fadePercent ? "green" : "purple",
      });
    }

    if (hottestTake.heat > 1000) {
      generatedAlerts.push({
        id: `heat-${hottestTake.id}`,
        icon: "ϟ",
        title: `${handle} is moving the Crowd.`,
        detail: `${formatCompact(hottestTake.heat)} heat on one locked take.`,
        time: "now",
        tone: "purple",
      });
    }
  }

  const seededRotation = seededChaosAlerts.slice((new Date().getMinutes() % 3), seededChaosAlerts.length);
  const fallbackRotation = [...seededRotation, ...seededChaosAlerts.slice(0, new Date().getMinutes() % 3)];

  return [...generatedAlerts, ...fallbackRotation].slice(0, 5);
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

function TakeButton({
  active,
  disabled = false,
  side,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  side: Side;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const isRide = side === "ride";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 rounded-xl border text-sm font-black uppercase transition active:scale-95 disabled:cursor-wait disabled:opacity-70 ${
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

function toneClass(tone: ChaosAlert["tone"], target: "text" | "bg") {
  const classes = {
    green: {
      text: "text-lime-300",
      bg: "bg-lime-400/10 text-lime-300",
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
