"use client";

import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/components/providers/ToastProvider";
import { ShareActions } from "@/components/ShareActions";
import { SocialLinks } from "@/components/SocialLinks";
import { UserAvatar } from "@/components/UserAvatar";
import { playSound } from "@/lib/sound";
import { ACTIVE_GAME_ID, getArenaGames, getGameById } from "@/lib/supabase/games";
import {
  attachAuthorToTake,
  formatTakeForUI,
  getArenaFeedByGameIds,
  getCurrentUserReactionMap,
  getFeaturedTakeFromList,
  getTrendingTakesFromList,
  isSeededTakeId,
  mergeArenaFeedWithSeeded,
  type ArenaTake,
} from "@/lib/supabase/arena";
import { reactToTake } from "@/lib/supabase/reactions";
import { createReply, getRepliesForTake, type TakeReplyWithAuthor } from "@/lib/supabase/replies";
import { createLockedTake } from "@/lib/supabase/takes";
import { getCrowdPressure, getHeatStatus, getReputationLevel } from "@/lib/reputation";
import { getPresenceMeta, getPresenceStatus } from "@/lib/presence";
import { seededChaosAlerts } from "@/data/seededCrowd";
import { getGameSport, sportTabs, type SportKey } from "@/data/sportsStructure";
import { worldCupStorylines } from "@/data/worldCupStorylines";
import { worldCupChaosAlerts, worldCupFeaturedMatch, worldCupLiveArenas, worldCupTrendingTakes } from "@/data/worldCupMvp";
import { ACTIVE_SPORT, getVisibleSportTabs, isPreTournamentMode, SHOW_MULTI_SPORT } from "@/lib/productConfig";
import { buildSiteUrl } from "@/lib/site-url";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";
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
  league: SportKey;
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

const featuredHotTake = worldCupFeaturedMatch;

const featuredHotTakesBySport: Record<SportKey, typeof featuredHotTake> = {
  NBA: featuredHotTake,
  NFL: {
    matchup: "KC vs PHI",
    status: "Live",
    period: "4th · 8:41",
    watching: "18.4K watching",
    handle: "@PrimeTalker",
    avatar: "PT",
    text: "Chiefs are built for this exact ugly game.",
    heat: "2.4K",
    rides: "1.4K",
    fades: "822",
    score: "KC 24 — 20 PHI",
    movement: "KC +12% last drive",
  },
  MLB: {
    matchup: "NYY vs BOS",
    status: "Live",
    period: "8th inning",
    watching: "9.2K watching",
    handle: "@RealDeal",
    avatar: "RD",
    text: "Boston crowd is about to swallow this bullpen.",
    heat: "1.4K",
    rides: "781",
    fades: "512",
    score: "NYY 4 — 5 BOS",
    movement: "BOS +17% last inning",
  },
  NHL: {
    matchup: "EDM vs DAL",
    status: "Live",
    period: "3rd · 11:08",
    watching: "6.8K watching",
    handle: "@NoMercy",
    avatar: "NM",
    text: "Next goal wins this. Dallas looks nervous.",
    heat: "1.2K",
    rides: "602",
    fades: "447",
    score: "EDM 2 — 2 DAL",
    movement: "EDM +9% last shift",
  },
  Soccer: {
    matchup: "ARS vs MCI",
    status: "Live",
    period: "76'",
    watching: "15.1K watching",
    handle: "@SharpMind",
    avatar: "SM",
    text: "City are baiting Arsenal into the late mistake.",
    heat: "2.2K",
    rides: "963",
    fades: "1.1K",
    score: "ARS 1 — 1 MCI",
    movement: "Fade wave +14%",
  },
  "NCAA Football": {
    matchup: "OSU vs MICH",
    status: "Live",
    period: "3rd · 4:12",
    watching: "21.6K watching",
    handle: "@ClutchCallz",
    avatar: "CC",
    text: "Michigan is bullying the line. Everybody sees it.",
    heat: "2.8K",
    rides: "1.6K",
    fades: "923",
    score: "OSU 17 — 21 MICH",
    movement: "MICH +18% this quarter",
  },
  "NCAA Basketball": {
    matchup: "DUKE vs UNC",
    status: "Live",
    period: "2nd · 3:04",
    watching: "17.7K watching",
    handle: "@MidRange",
    avatar: "MR",
    text: "UNC wants the smoke. Duke is leaking confidence.",
    heat: "2.1K",
    rides: "1.1K",
    fades: "684",
    score: "DUKE 68 — 72 UNC",
    movement: "UNC +15% last run",
  },
  UFC: {
    matchup: "Main Card",
    status: "Live",
    period: "Round 3",
    watching: "14.3K watching",
    handle: "@FadeKing",
    avatar: "FK",
    text: "That gas tank is gone. Fade the favorite now.",
    heat: "1.9K",
    rides: "735",
    fades: "1.0K",
    score: "R3 · 2:18",
    movement: "Fade +22% this round",
  },
  Tennis: {
    matchup: "WIM Final",
    status: "Live",
    period: "Set 4",
    watching: "11.2K watching",
    handle: "@RealDeal",
    avatar: "RD",
    text: "One break point away from a total collapse.",
    heat: "1.5K",
    rides: "802",
    fades: "441",
    score: "6-4 · 3-6 · 7-6 · 4-4",
    movement: "Pressure +11%",
  },
  "World Cup": {
    matchup: "USA vs BRA",
    status: "Live",
    period: "64'",
    watching: "24.8K watching",
    handle: "@HoopDreams",
    avatar: "HD",
    text: "Brazil are sleeping. This upset is sitting right there.",
    heat: "3.1K",
    rides: "1.8K",
    fades: "902",
    score: "USA 1 — 1 BRA",
    movement: "USA +19% last 10 min",
  },
  Playoffs: {
    matchup: "Finals Live",
    status: "Live",
    period: "Clutch Time",
    watching: "31.4K watching",
    handle: "@TalkHeavy23",
    avatar: "TH",
    text: "Legacy quarter. Somebody is about to be right.",
    heat: "4.7K",
    rides: "2.7K",
    fades: "1.4K",
    score: "Finals pressure",
    movement: "Heat +28%",
  },
};

const trendingTakes: TrendingTake[] = worldCupTrendingTakes;

const liveArenas: LiveArenaCard[] = worldCupLiveArenas as LiveArenaCard[];

export function FeedScreen({ onEnterArena, profile }: { onEnterArena: (gameId?: string) => void; profile?: Profile | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [takeChoices, setTakeChoices] = useState<Record<string, Side>>({});
  const [featuredChoice, setFeaturedChoice] = useState<Side | null>(null);
  const [lockedTake, setLockedTake] = useState("");
  const [lockTakeStatus, setLockTakeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lockTakeMessage, setLockTakeMessage] = useState("");
  const [starterRepUnlocked, setStarterRepUnlocked] = useState(false);
  const [myCallCount, setMyCallCount] = useState(profile?.created_takes_count ?? 0);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [gameTakes, setGameTakes] = useState<ArenaTake[]>([]);
  const [takeReactions, setTakeReactions] = useState<Record<string, TakeReaction["reaction"]>>({});
  const [reactionLoadingTakeId, setReactionLoadingTakeId] = useState<string | null>(null);
  const [reactionMessage, setReactionMessage] = useState("");
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [expandedRepliesByTake, setExpandedRepliesByTake] = useState<Record<string, boolean>>({});
  const [repliesByTake, setRepliesByTake] = useState<Record<string, TakeReplyWithAuthor[]>>({});
  const [replyDraftByTake, setReplyDraftByTake] = useState<Record<string, string>>({});
  const [replyLoadingTakeId, setReplyLoadingTakeId] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [activeSport, setActiveSport] = useState<SportKey>(ACTIVE_SPORT);
  const preTournamentMode = isPreTournamentMode();
  const visibleSportTabs = getVisibleSportTabs(sportTabs);
  const sportTakes = gameTakes.filter((take) => getGameSport(take.game_id) === activeSport);
  const visibleTakes = preTournamentMode ? gameTakes : sportTakes;
  const featuredTake = getFeaturedTakeFromList(visibleTakes);
  const trendingRealTakes = getTrendingTakesFromList(visibleTakes, 4);
  const activeSportGames = liveGames.filter((game) => getGameSportFromRow(game) === activeSport);
  const liveSportGames = activeSportGames.filter((game) => game.status === "live");
  const scheduledSportGames = activeSportGames.filter((game) => game.status === "scheduled");
  const finalSportGames = activeSportGames.filter((game) => game.status === "final");
  const activeSportGame = liveSportGames[0] ?? scheduledSportGames[0] ?? (activeSport === ACTIVE_SPORT ? activeGame : null);
  const combinedReactions = { ...takeChoices, ...takeReactions } as Record<string, TakeReaction["reaction"]>;
  const dynamicChaosAlerts = buildChaosAlerts(visibleTakes);

  useEffect(() => {
    let isMounted = true;

    async function loadArenaData() {
      const [{ game }, { games }] = await Promise.all([
        getGameById(ACTIVE_GAME_ID),
        getArenaGames(),
      ]);

      if (!isMounted) {
        return;
      }

      setActiveGame(game);
      setLiveGames(games);
      const knownGameIds = games.map((arenaGame: Game) => arenaGame.id);
      const targetGameIds = knownGameIds.length ? knownGameIds : [game?.id ?? ACTIVE_GAME_ID];
      const { takes: feed } = await getArenaFeedByGameIds(targetGameIds);
      const { reactionMap } = await getCurrentUserReactionMap(feed.map((take) => take.id));
      const mergedFeed = mergeArenaFeedWithSeeded(feed, game?.id ?? ACTIVE_GAME_ID);
      setGameTakes(mergedFeed);
      setTakeReactions(reactionMap);
      setFeedError("");
      setRecentActivity(
        mergedFeed.slice(0, 4).map((take) => `${formatTakeForUI(take).handle} locked a take`),
      );
      setIsFeedLoading(false);
    }

    loadArenaData().catch(() => {
      if (!isMounted) {
        return;
      }
      setIsFeedLoading(false);
      setFeedError("Could not load early calls right now.");
    });

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

    const { take, error, starterRepAwarded } = await createLockedTake({
      gameId: activeSportGame?.id ?? activeGame?.id ?? ACTIVE_GAME_ID,
      takeText: lockedTake,
    });

    if (error) {
      setLockTakeStatus("error");
      setLockTakeMessage(getUserFacingErrorMessage(error, "Unable to lock your take right now. Try again."));
      playSound("error");
      showToast("Unable to lock your take right now. Try again.", "error");
      return;
    }

    setLockedTake("");
    if (take) {
      const arenaTake = attachAuthorToTake(take, profile);
      setGameTakes((currentTakes) => [arenaTake, ...currentTakes]);
      setMyCallCount((currentCount) => currentCount + 1);
      setRecentActivity((currentActivity) =>
        [`${formatTakeForUI(arenaTake).handle} locked a take`, ...currentActivity].slice(0, 4),
      );
    }
    setStarterRepUnlocked(Boolean(starterRepAwarded));
    setLockTakeStatus("success");
    setLockTakeMessage(starterRepAwarded ? "You’re on the board." : "Your call is locked. Receipt pending until match ends.");
    playSound("take_locked");
    showToast("Take locked.", "success");
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
      setReactionMessage(getUserFacingErrorMessage(error, "Could not save your reaction. Try again."));
      playSound("error");
      showToast("Unable to save right now.", "error");
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
        playSound(savedReaction.reaction === "ride" ? "ride" : "fade");
        showToast(savedReaction.reaction === "ride" ? "You rode this take." : "You faded this take.", "success");
      }
    }

    setReactionLoadingTakeId(null);
  }

  function openTakeThread(takeId: string) {
    router.push(`/take/${takeId}`);
  }

  async function toggleReplies(takeId: string) {
    const nextOpen = !expandedRepliesByTake[takeId];
    setExpandedRepliesByTake((current) => ({ ...current, [takeId]: nextOpen }));

    if (!nextOpen || repliesByTake[takeId]) {
      return;
    }

    const { replies } = await getRepliesForTake(takeId);
    setRepliesByTake((current) => ({ ...current, [takeId]: replies }));
  }

  async function submitReply(takeId: string) {
    const replyText = (replyDraftByTake[takeId] ?? "").trim();
    if (!replyText || replyLoadingTakeId) {
      return;
    }

    setReplyLoadingTakeId(takeId);
    const { reply, error } = await createReply({ takeId, replyText });

    if (error || !reply) {
      setReactionMessage(getUserFacingErrorMessage(error, "Could not post reply. Try again."));
      playSound("error");
      showToast("Unable to save right now.", "error");
      setReplyLoadingTakeId(null);
      return;
    }

    const { replies } = await getRepliesForTake(takeId);
    setRepliesByTake((current) => ({ ...current, [takeId]: replies }));
    setReplyDraftByTake((current) => ({ ...current, [takeId]: "" }));
    setGameTakes((currentTakes) =>
      currentTakes.map((take) => (take.id === takeId ? { ...take, reply_count: take.reply_count + 1 } : take)),
    );
    playSound("reply_posted");
    showToast("Reply posted.", "success");
    setReplyLoadingTakeId(null);
  }

  if (preTournamentMode) {
    return (
      <div className="page-rhythm">
        <FeedHeader profile={profile} />
        <SportSelector activeSport={activeSport} onSelect={setActiveSport} visibleTabs={visibleSportTabs} />
        <PreTournamentCountdown />
        <PreTournamentEarlyCalls
          takes={visibleTakes}
          onOpenTake={openTakeThread}
          onReact={reactToLockedTake}
          reactions={combinedReactions}
          loadingTakeId={reactionLoadingTakeId}
          isFeedLoading={isFeedLoading}
          feedError={feedError}
          expandedRepliesByTake={expandedRepliesByTake}
          repliesByTake={repliesByTake}
          replyDraftByTake={replyDraftByTake}
          replyLoadingTakeId={replyLoadingTakeId}
          onToggleReplies={toggleReplies}
          onReplyDraftChange={(takeId, value) =>
            setReplyDraftByTake((current) => ({ ...current, [takeId]: value }))
          }
          onSubmitReply={submitReply}
        />
        <LockTakeComposer
          value={lockedTake}
          status={lockTakeStatus}
          message={lockTakeMessage}
          isFirstCall={myCallCount === 0}
          starterRepUnlocked={starterRepUnlocked}
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
        <PreTournamentStorylines />
        <PreTournamentNews />
      </div>
    );
  }

  return (
    <div className="page-rhythm">
      <FeedHeader profile={profile} />
      <SportSelector activeSport={activeSport} onSelect={setActiveSport} visibleTabs={visibleSportTabs} />
      <FeaturedHotTakeCard
        sport={activeSport}
        game={activeSportGame}
        take={featuredTake}
        onJoinLive={() => onEnterArena(activeSportGame?.id ?? ACTIVE_GAME_ID)}
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
        isFirstCall={myCallCount === 0}
        starterRepUnlocked={starterRepUnlocked}
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
        takes={visibleTakes}
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
      <GameGroups
        activeSport={activeSport}
        liveGames={liveSportGames}
        scheduledGames={scheduledSportGames}
        finalGames={finalSportGames}
        onEnterArena={onEnterArena}
      />
      <ChaosAlerts alerts={dynamicChaosAlerts} />
    </div>
  );
}

// Assumes kickoff-day countdown target at midnight Eastern Time on June 11, 2026.
const WORLD_CUP_KICKOFF_TARGET = "2026-06-11T00:00:00-04:00";

function PreTournamentCountdown() {
  const [countdown, setCountdown] = useState(getCountdownLabel());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdownLabel());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <FeedSection title="Countdown to Kickoff" icon="◷" action="">
      <div className="rounded-2xl border border-lime-300/20 bg-black/45 p-4">
        <h3 className="sports-display text-3xl italic leading-none text-white sm:text-4xl">World Cup Arena Opens Soon</h3>
        <p className="mt-3 text-sm font-semibold text-gray-300">
          Study the groups. Track the storylines. Lock your calls before kickoff.
        </p>
        <p className="mt-3 inline-block rounded-lg border border-lime-300/40 bg-lime-400/10 px-3 py-2 text-sm font-black uppercase tracking-[0.12em] text-lime-200">
          {countdown}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href="#lock-your-pick" className="grid min-h-11 place-items-center rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.1em] text-white">
            Make First Call
          </a>
          <Link href="/schedule" className="grid min-h-11 place-items-center rounded-xl border border-purple-300/45 bg-purple-500/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-purple-200">
            Schedule
          </Link>
        </div>
      </div>
    </FeedSection>
  );
}

function PreTournamentStorylines() {
  const storylines = worldCupStorylines.slice(0, 5);

  return (
    <FeedSection title="🔥 Storylines to Watch" icon="" action="">
      <div className="grid gap-2 sm:grid-cols-2">
        {storylines.map((storyline) => (
          <Link
            key={storyline.id}
            href={`/storylines/${storyline.slug}`}
            className="rounded-xl border border-white/10 bg-black/45 p-3 transition hover:border-purple-300/35 hover:bg-white/[0.03]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
              {storyline.category}
              {storyline.videoUrl ? " · Watch" : " · Read"}
            </p>
            <h3 className="mt-1 text-sm font-black text-white">{storyline.title}</h3>
            <p className="mt-1 text-xs font-semibold text-gray-400">{storyline.teaser}</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-purple-300">
              {storyline.videoUrl ? "Watch" : "Read"} ›
            </p>
          </Link>
        ))}
      </div>
    </FeedSection>
  );
}

function PreTournamentEarlyCalls({
  takes,
  reactions,
  loadingTakeId,
  isFeedLoading,
  feedError,
  expandedRepliesByTake,
  repliesByTake,
  replyDraftByTake,
  replyLoadingTakeId,
  onOpenTake,
  onReact,
  onToggleReplies,
  onReplyDraftChange,
  onSubmitReply,
}: {
  takes: ArenaTake[];
  reactions: Record<string, TakeReaction["reaction"]>;
  loadingTakeId: string | null;
  isFeedLoading: boolean;
  feedError: string;
  expandedRepliesByTake: Record<string, boolean>;
  repliesByTake: Record<string, TakeReplyWithAuthor[]>;
  replyDraftByTake: Record<string, string>;
  replyLoadingTakeId: string | null;
  onOpenTake: (takeId: string) => void;
  onReact: (takeId: string, reaction: Side) => void;
  onToggleReplies: (takeId: string) => void;
  onReplyDraftChange: (takeId: string, value: string) => void;
  onSubmitReply: (takeId: string) => void;
}) {
  const [sharingTakeId, setSharingTakeId] = useState<string | null>(null);

  return (
    <FeedSection title="Early Call Feed" icon="ϟ" action="">
      {isFeedLoading ? (
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
          <p className="text-sm font-semibold text-gray-300">Loading early calls...</p>
        </div>
      ) : null}
      {feedError ? (
        <div className="mb-2 rounded-2xl border border-red-400/35 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
          {feedError}
        </div>
      ) : null}
      {takes.length ? (
        <div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
          <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/80 px-3 py-2 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">Early Call Feed</p>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Newest first</p>
          </div>
          {takes.map((take) => {
            const activeReaction = reactions[take.id];
            const isLoading = loadingTakeId === take.id;
            const { handle } = formatTakeForUI(take);
            const totalReactions = Math.max(take.ride_count + take.fade_count, 1);
            const ridePercent = Math.round((take.ride_count / totalReactions) * 100);
            const fadePercent = 100 - ridePercent;
            const repliesOpen = Boolean(expandedRepliesByTake[take.id]);
            const replies = repliesByTake[take.id] ?? [];
            const draftReply = replyDraftByTake[take.id] ?? "";
            const isReplyLoading = replyLoadingTakeId === take.id;
            return (
              <article key={take.id} className="rounded-xl border border-white/10 bg-black/45 p-3">
                <button type="button" onClick={() => onOpenTake(take.id)} className="w-full text-left">
                  <p className="text-xs font-black text-lime-300">{handle}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{take.take_text}</p>
                  <p className="mt-1 text-[11px] font-bold text-gray-500">{formatTakeAge(take.created_at)}</p>
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
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
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-black uppercase">
                  <p className="rounded-md border border-lime-300/25 bg-lime-400/10 px-2 py-1 text-lime-200">
                    Ride {ridePercent}%
                  </p>
                  <p className="rounded-md border border-purple-300/25 bg-purple-500/10 px-2 py-1 text-purple-200">
                    Fade {fadePercent}%
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleReplies(take.id)}
                    className="text-xs font-black uppercase text-purple-300"
                  >
                    {repliesOpen ? "Hide replies" : "View replies"}
                  </button>
                  <span className="text-xs font-bold text-gray-400">{take.reply_count} replies</span>
                  <button
                    type="button"
                    onClick={() => setSharingTakeId((current) => (current === take.id ? null : take.id))}
                    className="ml-auto text-xs font-black uppercase text-lime-300"
                  >
                    Share Call
                  </button>
                </div>
                {sharingTakeId === take.id ? (
                  <div className="mt-2 rounded-lg border border-white/10 bg-black/50 p-2">
                    <p className="text-xs font-black uppercase text-white">Share Your Call</p>
                    <ShareActions
                      type="call"
                      title="Share Your Call"
                      text={`I've got this locked before kickoff. Check the receipt on Lockt.`}
                      caption={`${handle} locked: "${take.take_text}" before kickoff. Check the receipt on Lockt.`}
                      url={buildSiteUrl(`/take/${encodeURIComponent(take.id)}`)}
                      className="mt-2"
                    />
                  </div>
                ) : null}
                <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={draftReply}
                    onChange={(event) => onReplyDraftChange(take.id, event.target.value)}
                    placeholder="Reply"
                    className="min-h-10 rounded-lg border border-white/10 bg-black/55 px-3 text-sm font-semibold text-white outline-none placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => onSubmitReply(take.id)}
                    disabled={isReplyLoading || !draftReply.trim()}
                    className="min-h-10 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-xs font-black uppercase text-white disabled:opacity-50"
                  >
                    {isReplyLoading ? "..." : "Reply"}
                  </button>
                </div>
                {repliesOpen ? (
                  <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-black/50 p-2">
                    {replies.length ? (
                      replies.slice(0, 6).map((reply) => (
                        <div key={reply.id} className="border-b border-white/10 pb-1 text-xs last:border-b-0 last:pb-0">
                          <p className="font-black text-gray-200">@{reply.author?.username ?? "Talker"}</p>
                          <p className="font-semibold text-gray-300">{reply.reply_text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-semibold text-gray-400">No replies yet.</p>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-lime-300">No public calls yet.</p>
          <p className="mt-2 text-sm font-semibold text-gray-300">
            Be one of the first to lock a World Cup take.
          </p>
        </div>
      )}
    </FeedSection>
  );
}

function PreTournamentNews() {
  return (
    <FeedSection title="⚽ Team News / Injury Watch" icon="" action="Coming Soon">
      <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
        <p className="text-sm font-semibold text-gray-300">
          Team news and injury updates will appear here as kickoff approaches.
        </p>
      </div>
      <SocialLinks
        className="mt-3"
        compact
        heading="Follow Lockt"
        subtext="World Cup calls, group breakdowns, receipt drops, and tournament storylines."
      />
    </FeedSection>
  );
}

function getCountdownLabel() {
  const now = Date.now();
  const target = new Date(WORLD_CUP_KICKOFF_TARGET).getTime();
  const diff = Math.max(0, target - now);
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

function SportSelector({
  activeSport,
  onSelect,
  visibleTabs,
}: {
  activeSport: SportKey;
  onSelect: (sport: SportKey) => void;
  visibleTabs: SportKey[];
}) {
  return (
    <nav className="rounded-[1.5rem] border border-white/10 bg-black/30 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.3)] backdrop-blur">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Sport filters">
        {visibleTabs.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => onSelect(sport)}
            aria-pressed={activeSport === sport}
            className={`min-h-10 shrink-0 rounded-xl border px-3 text-[10px] font-black uppercase tracking-[0.12em] transition active:scale-[0.98] ${
              activeSport === sport
                ? "border-lime-300/60 bg-lime-400/15 text-lime-200 shadow-[0_0_22px_rgba(132,204,22,0.14)]"
                : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-purple-300/35 hover:text-purple-200"
            }`}
          >
            {sport}
          </button>
        ))}
      </div>
    </nav>
  );
}

function FeedHeader({ profile }: { profile?: Profile | null }) {
  return <AppHeader profile={profile} subtitle="World Cup calls. Tournament reputation." rightHref="/receipts" rightAriaLabel="Receipts" />;
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

function getGameSportFromRow(game: Game): SportKey {
  const leagueSport = sportTabs.find((sport) => sport.toLowerCase() === game.league.toLowerCase());

  if (leagueSport) {
    return leagueSport;
  }

  if (game.sport?.toLowerCase() === "basketball") {
    return "NBA";
  }

  return getGameSport(game.id);
}

function gameToLiveArenaCard(game: Game): LiveArenaCard {
  const total = Math.max(game.ride_count + game.fade_count, 1);
  const ridePercent = Math.round((game.ride_count / total) * 100);
  const fadePercent = 100 - ridePercent;

  return {
    id: game.id,
    league: getGameSportFromRow(game),
    matchup: `${game.away_team} vs ${game.home_team}`,
    quarter: [game.period, game.clock].filter(Boolean).join(" ") || formatGameStatus(game.status),
    viewers: formatCompact(game.watching_count),
    score: `${game.away_score} - ${game.home_score}`,
    riding: `${ridePercent}% Riding ${game.away_team}`,
    fading: `${fadePercent}% Fading ${game.home_team}`,
    heat: formatCompact(game.heat),
    trend: game.event_name ?? "Live Room",
    trendDirection: ridePercent >= fadePercent ? "up" : "down",
  };
}

function FeaturedHotTakeCard({
  sport,
  game,
  take,
  onJoinLive,
  onOpenTake,
}: {
  sport: SportKey;
  game: Game | null;
  take: ArenaTake | null;
  onJoinLive: () => void;
  onOpenTake?: () => void;
}) {
  const fallbackTake = featuredHotTakesBySport[sport];
  const matchup = game ? `${game.away_team} vs ${game.home_team}` : fallbackTake.matchup;
  const period = game ? [game.period, game.clock].filter(Boolean).join(" · ") : fallbackTake.period;
  const watching = game ? `${formatCompact(game.watching_count)} watching` : fallbackTake.watching;
  const score = game
    ? `${game.away_team} ${game.away_score} — ${game.home_score} ${game.home_team}`
    : fallbackTake.score;
  const heat = take ? formatCompact(take.heat) : game ? formatCompact(game.heat) : fallbackTake.heat;
  const rides = take ? formatCompact(take.ride_count) : game ? formatCompact(game.ride_count) : fallbackTake.rides;
  const fades = take ? formatCompact(take.fade_count) : game ? formatCompact(game.fade_count) : fallbackTake.fades;
  const replies = take ? formatCompact(take.reply_count) : "0";
  const status = game ? formatGameStatus(game.status) : fallbackTake.status;
  const author = take ? formatTakeForUI(take) : null;
  const level = getReputationLevel(take?.author?.reputation_score ?? 0, take?.author?.created_takes_count ?? 0);
  const heatStatus = getHeatStatus({ heat: take?.heat ?? game?.heat ?? 0, reputation: take?.author?.reputation_score ?? 0 });
  const pressure = getCrowdPressure({
    rideCount: take?.ride_count ?? game?.ride_count ?? 0,
    fadeCount: take?.fade_count ?? game?.fade_count ?? 0,
    heat: take?.heat ?? game?.heat ?? 0,
    replyCount: take?.reply_count ?? 0,
  });
  const handle = author?.handle ?? fallbackTake.handle;
  const avatar = author?.initials ?? fallbackTake.avatar;
  const avatarUrl = author?.avatarUrl ?? null;
  const takeText = take?.take_text ?? fallbackTake.text;
  const presence = getPresenceMeta(getPresenceStatus(handle));

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
            Open Match Room
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
              <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-gray-400">
                <span className={`h-1.5 w-1.5 rounded-full ${presence.className}`} />
                <span className={presence.textClassName}>{presence.label}</span>
              </span>
              <span className="rounded-md border border-lime-300/25 bg-lime-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-lime-300">
                {level.title}
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-black italic leading-tight text-white sm:text-4xl">
              {takeText}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg border border-lime-300/25 bg-lime-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-lime-200">
                {heatStatus.label}
              </span>
              <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
                pressure.tone === "green"
                  ? "border-lime-300/25 bg-lime-400/10 text-lime-200"
                  : "border-purple-300/25 bg-purple-500/10 text-purple-200"
              }`}>
                {pressure.label} · {pressure.detail}
              </span>
            </div>
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
            <p className="mt-1 text-xs font-black uppercase text-lime-300">{fallbackTake.movement}</p>
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
  isFirstCall,
  starterRepUnlocked,
  lockedCount,
  onChange,
  onLock,
}: {
  value: string;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  isFirstCall: boolean;
  starterRepUnlocked: boolean;
  lockedCount: number;
  onChange: (value: string) => void;
  onLock: () => void;
}) {
  const isLockedDisabled = status === "loading" || value.trim().length === 0;

  return (
    <section id="lock-your-pick" className="rounded-[1.75rem] border border-purple-300/30 bg-purple-500/10 p-4 shadow-[0_0_34px_rgba(168,85,247,0.14)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">World Cup Call</p>
          <h2 className="sports-display mt-1 text-2xl italic leading-none text-white">
            {isFirstCall ? "Make Your First World Cup Call" : "Lock your pick."}
          </h2>
        </div>
        <span className="rounded-full border border-lime-300/25 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase text-lime-300">
          {lockedCount} calls locked
        </span>
      </div>
      {isFirstCall ? (
        <div className="mb-3 rounded-xl border border-lime-300/30 bg-lime-400/10 p-3">
          <p className="text-xs font-semibold text-gray-200">
            Every receipt starts with a call. Pick a match, choose a side, or call your tournament winner.
          </p>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.1em] text-lime-200">
            Make your first call to unlock: +200 Starter Rep · First Lock Trophy · Player status
          </p>
        </div>
      ) : null}

      <label className="sr-only" htmlFor="arena-lock-take">
        Lock your World Cup call
      </label>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-stretch">
        <div className="relative">
          <textarea
            id="arena-lock-take"
            value={value}
            maxLength={150}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Lock your World Cup call... Who wins? Who scores first?"
            className="min-h-24 w-full resize-none rounded-2xl border border-purple-300/45 bg-black/55 px-4 pb-10 pt-4 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-lime-300/60 focus:shadow-[0_0_24px_rgba(132,204,22,0.12)] md:min-h-20"
          />
          <span className="pointer-events-none absolute bottom-3 right-4 text-xs font-bold text-gray-500">{value.length}/150</span>
        </div>
        <button
          type="button"
          onClick={onLock}
          disabled={isLockedDisabled}
          className="min-h-14 w-full rounded-2xl border border-purple-300/60 bg-purple-500/15 px-6 text-sm font-black uppercase tracking-[0.12em] text-purple-100 shadow-[0_0_24px_rgba(168,85,247,0.14)] transition hover:-translate-y-0.5 hover:bg-purple-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:w-auto"
        >
          {status === "loading" ? "Locking..." : isFirstCall ? "Make My First Call" : "Lock My Call"}
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
        <p>Locked before kickoff. Check the receipt after the final whistle.</p>
        <p>Called it or missed it, check the receipt.</p>
      </div>
      {starterRepUnlocked ? (
        <div className="mt-3 rounded-xl border border-lime-300/35 bg-lime-400/10 p-3">
          <p className="text-sm font-black text-lime-100">You&apos;re on the board.</p>
          <p className="mt-1 text-xs font-semibold text-gray-200">+200 Starter Rep</p>
          <p className="text-xs font-semibold text-gray-200">🏆 First Lock Trophy unlocked</p>
          <p className="text-xs font-semibold text-gray-200">Rookie → Player</p>
          <p className="mt-2 text-xs font-semibold text-gray-300">Your call is pending until the match is played.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Link href="/receipts" className="rounded-lg border border-purple-300/35 bg-purple-500/10 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-purple-100">
              View My Receipt Board
            </Link>
            <Link href="/app" className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-white">
              Enter the Arena
            </Link>
            <button
              type="button"
              onClick={() => onChange("Called it. Check the receipt.")}
              className="rounded-lg border border-lime-300/35 bg-lime-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-lime-100"
            >
              Share My Call
            </button>
          </div>
        </div>
      ) : null}
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
          const heatStatus = getHeatStatus({ heat: take.heat, reputation: take.author?.reputation_score ?? 0 });
          const pressure = getCrowdPressure({
            rideCount: take.ride_count,
            fadeCount: take.fade_count,
            heat: take.heat,
            replyCount: take.reply_count,
          });
          const presence = getPresenceMeta(getPresenceStatus(handle));

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
                    <span className={`h-1.5 w-1.5 rounded-full ${presence.className}`} />
                    <span className={`text-[10px] font-black uppercase ${presence.textClassName}`}>{presence.label}</span>
                    <span className="text-xs font-bold text-gray-500">{formatTakeAge(take.created_at)}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-black leading-tight text-white">{take.take_text}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md border border-lime-300/20 bg-lime-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-lime-300">
                      {heatStatus.label}
                    </span>
                    <span className="rounded-md border border-purple-300/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-purple-200">
                      {pressure.label}
                    </span>
                  </div>
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
          const heatStatus = getHeatStatus({ heat: take.heat, reputation: take.author?.reputation_score ?? 0 });
          const presence = getPresenceMeta(getPresenceStatus(handle));

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
              <p className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                <span className={`h-1.5 w-1.5 rounded-full ${presence.className}`} />
                <span className={presence.textClassName}>{presence.label}</span>
                <span>·</span>
                <span>{formatTakeAge(take.created_at)}</span>
              </p>
              <h3 className="mt-3 min-h-14 text-xl font-black leading-tight text-white">{take.take_text}</h3>
              <p className="mt-2 rounded-md border border-lime-300/20 bg-lime-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-lime-200">
                {heatStatus.label}
              </p>
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

function GameGroups({
  activeSport,
  liveGames,
  scheduledGames,
  finalGames,
  onEnterArena,
}: {
  activeSport: SportKey;
  liveGames: Game[];
  scheduledGames: Game[];
  finalGames: Game[];
  onEnterArena: (gameId?: string) => void;
}) {
  return (
    <div className="space-y-5">
      <LiveArenas activeSport={activeSport} games={liveGames} onEnterArena={onEnterArena} />
      <ScheduledGames activeSport={activeSport} games={scheduledGames} onEnterArena={onEnterArena} />
      {finalGames.length > 0 && <FinalGames games={finalGames.slice(0, 4)} onEnterArena={onEnterArena} />}
    </div>
  );
}

function LiveArenas({
  activeSport,
  games,
  onEnterArena,
}: {
  activeSport: SportKey;
  games: Game[];
  onEnterArena: (gameId?: string) => void;
}) {
  const realArenas = games.map(gameToLiveArenaCard);
  const fallbackArenas = liveArenas.filter((arena) => arena.league === activeSport);
  const arenas = realArenas.length ? realArenas : fallbackArenas;

  return (
      <FeedSection title="Featured World Cup Matches" icon="≋" action="See all">
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {arenas.map((arena) => {
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
                onClick={() => onEnterArena(arena.id)}
                className="mt-4 min-h-11 w-full rounded-xl border border-lime-300/30 bg-lime-400/5 text-sm font-black uppercase text-lime-300 transition active:scale-[0.98]"
              >
                Open Match Room
              </button>
            </article>
          );
        })}
        {!arenas.length && (
          <div className="min-w-full rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-300">{activeSport} rooms warming up</p>
            <p className="mt-2 text-sm font-semibold text-gray-400">
              Match rooms are loading. Calls, locks, receipts, and reputation stay the same.
            </p>
          </div>
        )}
      </div>
    </FeedSection>
  );
}

function ScheduledGames({
  activeSport,
  games,
  onEnterArena,
}: {
  activeSport: SportKey;
  games: Game[];
  onEnterArena: (gameId?: string) => void;
}) {
  if (!games.length) {
    return null;
  }

  return (
    <FeedSection title="Upcoming World Cup Matches" icon="◷" action={`${games.length} scheduled`}>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {games.map((game) => (
          <ScheduledGameCard key={game.id} game={game} activeSport={activeSport} onEnterArena={onEnterArena} />
        ))}
      </div>
    </FeedSection>
  );
}

function ScheduledGameCard({
  game,
  activeSport,
  onEnterArena,
}: {
  game: Game;
  activeSport: SportKey;
  onEnterArena: (gameId?: string) => void;
}) {
  const startTime = formatStartTime(game.starts_at);

  return (
    <article className="premium-card min-w-[16.5rem] snap-start rounded-2xl border border-purple-300/20 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.34)]">
      <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.12em]">
        <span className="rounded-md border border-purple-300/45 bg-purple-500/10 px-2 py-1 text-purple-200">
          {game.league || activeSport}
        </span>
        <span className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-gray-300">Scheduled</span>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <p className="sports-display text-4xl leading-none text-white">{game.away_team}</p>
        <span className="text-xs font-black text-purple-200">VS</span>
        <p className="sports-display text-4xl leading-none text-white">{game.home_team}</p>
      </div>
      <p className="mt-4 text-center text-xs font-black uppercase tracking-[0.12em] text-lime-300">
        {startTime}
      </p>
      {game.event_name && (
        <p className="mt-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">{game.event_name}</p>
      )}
      <button
        type="button"
        onClick={() => onEnterArena(game.id)}
        className="mt-4 min-h-11 w-full rounded-xl border border-purple-300/45 bg-purple-500/10 text-sm font-black uppercase tracking-[0.1em] text-purple-200 transition hover:bg-purple-500/15 active:scale-[0.98]"
      >
        Preview Game Room
      </button>
    </article>
  );
}

function FinalGames({ games, onEnterArena }: { games: Game[]; onEnterArena: (gameId?: string) => void }) {
  return (
    <FeedSection title="Final" icon="✓" action="Archive">
      <div className="grid gap-2 sm:grid-cols-2">
        {games.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => onEnterArena(game.id)}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-center transition hover:border-purple-300/25 hover:bg-white/[0.03] active:scale-[0.99]"
          >
            <span className="text-sm font-black text-white">
              {game.away_team} <span className="text-lime-300">{game.away_score}</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Final</span>
            <span className="text-sm font-black text-white">
              {game.home_team} <span className="text-purple-300">{game.home_score}</span>
            </span>
          </button>
        ))}
      </div>
    </FeedSection>
  );
}

function formatStartTime(startsAt: string | null) {
  if (!startsAt) {
    return "Tipoff TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startsAt));
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

  const baseAlerts = SHOW_MULTI_SPORT ? seededChaosAlerts : worldCupChaosAlerts;
  const seededRotation = baseAlerts.slice((new Date().getMinutes() % 3), baseAlerts.length);
  const fallbackRotation = [...seededRotation, ...baseAlerts.slice(0, new Date().getMinutes() % 3)];

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
          {icon ? <span className="mr-2 not-italic">{icon}</span> : null}
          {title}
        </h2>
        {action ? (
          <button type="button" className="text-xs font-black uppercase text-purple-300">
            {action} ›
          </button>
        ) : null}
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
