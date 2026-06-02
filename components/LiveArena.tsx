"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { useToast } from "@/components/providers/ToastProvider";
import { formatRepSwing, QUICK_PICK_LOSS, QUICK_PICK_WIN } from "@/lib/engagement";
import { formatTakeForUI, getArenaFeed, getCurrentUserReactionMap, type ArenaTake } from "@/lib/supabase/arena";
import { ACTIVE_GAME_ID, getGameById } from "@/lib/supabase/games";
import { createQuickPick, getMyQuickPicks } from "@/lib/supabase/quickPicks";
import { reactToTake } from "@/lib/supabase/reactions";
import { createReply, getRepliesForTake, type TakeReplyWithAuthor } from "@/lib/supabase/replies";
import { createClient } from "@/lib/supabase/client";
import { createLockedTake } from "@/lib/supabase/takes";
import { getWorldCupMatchById } from "@/data/worldCupSchedule";
import {
  isMatchHubMode,
  SHOW_FAKE_LIVE_ACTIVITY,
  SHOW_REP_SYSTEM_PUBLICLY,
} from "@/lib/productConfig";
import { buildGameRoomShareText } from "@/lib/worldCupPublicNav";
import { buildSiteUrl } from "@/lib/site-url";
import { shareWithFallback } from "@/lib/share";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";
import type { Game, TakeReaction } from "@/lib/supabase/types";

type ArenaTab = "calls" | "control-room";
type Side = "ride" | "fade";

type TopTalker = {
  rank: number;
  handle: string;
  heat: string;
  avatar: string;
};

type QuickPickQuestion = {
  key: string;
  pickType: "momentum" | "scoring" | "tempo" | "clutch" | "outcome";
  questionText: string;
  options: Array<{
    label: string;
    value: string;
    tone: "green" | "purple";
  }>;
};

const topTalkers: TopTalker[] = [
  { rank: 1, handle: "@TalkHeavy23", heat: "3.6K", avatar: "TH" },
  { rank: 2, handle: "@BootsOnly", heat: "3.1K", avatar: "BO" },
  { rank: 3, handle: "@FadeKing", heat: "2.7K", avatar: "FK" },
  { rank: 4, handle: "@MidfieldBoss", heat: "2.4K", avatar: "MR" },
  { rank: 5, handle: "@GoalRush", heat: "2.1K", avatar: "HD" },
];

export function LiveArena({ gameId = ACTIVE_GAME_ID, onBack }: { gameId?: string; onBack: () => void }) {
  const { showToast } = useToast();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<ArenaTab>("calls");
  const [game, setGame] = useState<Game | null>(null);
  const [quickPickSelections, setQuickPickSelections] = useState<Record<string, string>>({});
  const [quickPickResults, setQuickPickResults] = useState<Record<string, "pending" | "hit" | "miss">>({});
  const [quickPickMessage, setQuickPickMessage] = useState("");
  const [quickPickCrowdLine, setQuickPickCrowdLine] = useState("");
  const [savingQuickPickKey, setSavingQuickPickKey] = useState<string | null>(null);
  const [quickPickQueue, setQuickPickQueue] = useState<QuickPickQuestion[]>([]);
  const [quickPickRecentKeys, setQuickPickRecentKeys] = useState<string[]>([]);
  const [feedTakes, setFeedTakes] = useState<ArenaTake[]>([]);
  const [takeReactions, setTakeReactions] = useState<Record<string, TakeReaction["reaction"]>>({});
  const [reactionLoadingTakeId, setReactionLoadingTakeId] = useState<string | null>(null);
  const [replyLoadingTakeId, setReplyLoadingTakeId] = useState<string | null>(null);
  const [repliesByTake, setRepliesByTake] = useState<Record<string, TakeReplyWithAuthor[]>>({});
  const [expandedReplyTakeIds, setExpandedReplyTakeIds] = useState<Record<string, boolean>>({});
  const [replyDraftByTake, setReplyDraftByTake] = useState<Record<string, string>>({});
  const [replyingToReplyByTake, setReplyingToReplyByTake] = useState<Record<string, string | null>>({});
  const [newTakeText, setNewTakeText] = useState("");
  const [isLockingTake, setIsLockingTake] = useState(false);
  const [takesMessage, setTakesMessage] = useState("");
  const [postToFeedNotice, setPostToFeedNotice] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const awayTeam = game?.away_team ?? "AWAY";
  const homeTeam = game?.home_team ?? "HOME";

  const totalFeedCount = feedTakes.length;
  const visibleTakes = useMemo(() => feedTakes.slice(0, 30), [feedTakes]);

  useEffect(() => {
    let isMounted = true;

    async function loadGameAndQuickPicks() {
      const [{ game: loadedGame }, { quickPicks }, { data: authState }] = await Promise.all([
        getGameById(gameId),
        getMyQuickPicks(gameId),
        supabase?.auth.getSession() ?? Promise.resolve({ data: { session: null } }),
      ]);
      const effectiveGameId = loadedGame?.id ?? gameId;
      const { takes } = await getArenaFeed(effectiveGameId);

      if (!isMounted) {
        return;
      }

      const nextSelections = Object.fromEntries((quickPicks ?? []).map((quickPick) => [toQuickPickKey(quickPick.question_text), quickPick.selected_side]));

      setGame(loadedGame);
      setQuickPickSelections(nextSelections);
      setQuickPickResults(
        Object.fromEntries((quickPicks ?? []).map((quickPick) => [toQuickPickKey(quickPick.question_text), quickPick.result ?? "pending"])),
      );

      const initialQueue = getQuickPickQuestions({
        game: loadedGame,
        awayTeam: loadedGame?.away_team ?? "AWAY",
        homeTeam: loadedGame?.home_team ?? "HOME",
        recentKeys: [],
      })
        .filter((question) => !nextSelections[question.key])
        .slice(0, 3);

      setQuickPickQueue(initialQueue);
      setQuickPickRecentKeys(initialQueue.map((question) => question.key));
      setQuickPickCrowdLine(getQuickPickCrowdLine(loadedGame, initialQueue[0]));
      setFeedTakes(takes ?? []);
      const { reactionMap } = await getCurrentUserReactionMap((takes ?? []).map((take) => take.id));
      setTakeReactions(reactionMap ?? {});
      setIsAuthenticated(Boolean(authState?.session?.user));
    }

    loadGameAndQuickPicks();

    return () => {
      isMounted = false;
    };
  }, [gameId, supabase]);

  const worldCupMatch = useMemo(() => parseWorldCupMatchFromGameId(gameId), [gameId]);
  const isWorldCupRoom = Boolean(worldCupMatch) || game?.league === "World Cup" || gameId.startsWith("wc-");
  const makeCallHref = worldCupMatch ? `/schedule/${worldCupMatch.id}/make-call` : null;
  const simplifiedRoom = isMatchHubMode();

  async function shareGameRoom() {
    if (!worldCupMatch) {
      return;
    }

    const url = buildSiteUrl(`/game/${gameId}`);
    const outcome = await shareWithFallback({
      title: "LOCKT Game Room",
      text: buildGameRoomShareText(worldCupMatch),
      url,
    });

    if (outcome !== "cancelled") {
      showToast(outcome === "shared" ? "Shared." : "Game Room link copied.", "success");
    }
  }

  async function lockIt() {
    if (!newTakeText.trim()) {
      setTakesMessage("Write your call before locking it.");
      return;
    }

    if (!isAuthenticated) {
      setTakesMessage("Save this call by signing in first. You can browse freely, but locking needs an account.");
      return;
    }

    setIsLockingTake(true);
    setTakesMessage("");
    const { take, error } = await createLockedTake({
      gameId,
      takeText: newTakeText.trim(),
    });
    setIsLockingTake(false);

    if (error || !take) {
      setTakesMessage(getUserFacingErrorMessage(error, "Unable to lock your take right now. Try again."));
      showToast("Unable to lock your take right now. Try again.", "error");
      return;
    }

    const { takes, error: refreshError } = await getArenaFeed(take.game_id);
    if (!refreshError) {
      setFeedTakes(takes);
      const { reactionMap } = await getCurrentUserReactionMap(takes.map((row) => row.id));
      setTakeReactions(reactionMap);
    }
    setNewTakeText("");
    setTakesMessage("Your call is saved for this match.");
    setPostToFeedNotice("Posted to the match room feed.");
    window.setTimeout(() => setPostToFeedNotice(""), 2200);
    showToast("Take locked.", "success");
  }

  async function reactToLockedTake(takeId: string, reaction: Side) {
    if (!isAuthenticated) {
      setTakesMessage("Log in to ride or fade takes.");
      return;
    }

    setReactionLoadingTakeId(takeId);
    const { reaction: savedReaction, take, error } = await reactToTake({ takeId, reaction });
    setReactionLoadingTakeId(null);

    if (error) {
      setTakesMessage(getUserFacingErrorMessage(error, "Could not save your reaction."));
      showToast("Could not save your reaction.", "error");
      return;
    }

    if (savedReaction) {
      setTakeReactions((current) => ({ ...current, [takeId]: savedReaction.reaction }));
    }

    if (take) {
      setFeedTakes((current) =>
        current.map((item) =>
          item.id === take.id
            ? {
                ...item,
                ride_count: take.ride_count,
                fade_count: take.fade_count,
                heat: take.heat,
              }
            : item,
        ),
      );
    }
    showToast(reaction === "ride" ? "You rode this take." : "You faded this take.", "success");
  }

  async function toggleReplies(takeId: string) {
    const nextOpen = !expandedReplyTakeIds[takeId];
    setExpandedReplyTakeIds((current) => ({ ...current, [takeId]: nextOpen }));
    if (!nextOpen || repliesByTake[takeId]) {
      return;
    }

    const { replies, error } = await getRepliesForTake(takeId);
    if (error) {
      setTakesMessage(getUserFacingErrorMessage(error, "Unable to load replies."));
      return;
    }
    setRepliesByTake((current) => ({ ...current, [takeId]: replies }));
  }

  async function submitReply(takeId: string) {
    const replyText = (replyDraftByTake[takeId] ?? "").trim();
    if (!replyText) {
      return;
    }
    if (!isAuthenticated) {
      setTakesMessage("Log in to reply.");
      return;
    }

    setReplyLoadingTakeId(takeId);
    const { reply, error } = await createReply({
      takeId,
      replyText,
      parentReplyId: replyingToReplyByTake[takeId] ?? null,
    });
    setReplyLoadingTakeId(null);

    if (error || !reply) {
      setTakesMessage(getUserFacingErrorMessage(error, "Could not post reply."));
      showToast("Could not post reply.", "error");
      return;
    }

    const { replies } = await getRepliesForTake(takeId);
    setRepliesByTake((current) => ({ ...current, [takeId]: replies }));
    setExpandedReplyTakeIds((current) => ({ ...current, [takeId]: true }));
    setReplyDraftByTake((current) => ({ ...current, [takeId]: "" }));
    setReplyingToReplyByTake((current) => ({ ...current, [takeId]: null }));
    setFeedTakes((current) =>
      current.map((item) => (item.id === takeId ? { ...item, reply_count: (item.reply_count ?? 0) + 1 } : item)),
    );
    showToast("Reply posted.", "success");
  }

  const rotateQuickPick = useCallback((reason: "timer" | "interaction") => {
    if (!quickPickQueue.length) {
      return;
    }

    const currentKeys = quickPickQueue.map((question) => question.key);
    const nextRecentKeys = [...quickPickRecentKeys, ...currentKeys].slice(-12);
    const pool = getQuickPickQuestions({
      game,
      awayTeam,
      homeTeam,
      recentKeys: nextRecentKeys,
    });

    const incoming = pool.find((question) => !currentKeys.includes(question.key) && !quickPickSelections[question.key]);

    if (!incoming) {
      return;
    }

    setQuickPickQueue((current) => [...current.slice(1), incoming]);
    setQuickPickRecentKeys(nextRecentKeys);

    if (reason === "timer") {
      setQuickPickCrowdLine(getQuickPickCrowdLine(game, incoming));
    }
  }, [awayTeam, game, homeTeam, quickPickQueue, quickPickRecentKeys, quickPickSelections]);

  useEffect(() => {
    if (!quickPickQueue.length || savingQuickPickKey) {
      return;
    }

    const delayMs = game?.status === "live" ? 14000 : game?.status === "scheduled" ? 22000 : 26000;
    const timer = window.setTimeout(() => {
      rotateQuickPick("timer");
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [game?.status, quickPickQueue, rotateQuickPick, savingQuickPickKey]);

  async function lockQuickPick(question: QuickPickQuestion, selectedSide: string) {
    if (quickPickSelections[question.key] || savingQuickPickKey) {
      return;
    }

    setSavingQuickPickKey(question.key);
    setQuickPickResults((current) => ({
      ...current,
      [question.key]: "pending",
    }));

    const { quickPick, error } = await createQuickPick({
      gameId,
      questionText: question.questionText,
      selectedSide,
      pickType: question.pickType,
      promptKey: question.key,
    });

    setSavingQuickPickKey(null);

    if (error || !quickPick) {
      setQuickPickMessage(error?.message || "Could not save that quick pick.");
      setQuickPickResults((current) => ({
        ...current,
        [question.key]: "miss",
      }));
      return;
    }

    setQuickPickSelections((current) => ({
      ...current,
      [question.key]: quickPick.selected_side,
    }));

    setQuickPickMessage("Quick Pick locked: " + question.questionText + " · " + quickPick.selected_side + " · " + formatRepSwing(QUICK_PICK_WIN, QUICK_PICK_LOSS));
    setQuickPickCrowdLine(getQuickPickCrowdLine(game, question));

    const settledResult = Math.random() > 0.52 ? "hit" : "miss";
    window.setTimeout(() => {
      setQuickPickResults((current) => ({
        ...current,
        [question.key]: settledResult,
      }));
      setQuickPickMessage(
        settledResult === "hit"
          ? "Quick Pick hit. " + formatRepSwing(QUICK_PICK_WIN, QUICK_PICK_LOSS)
          : "Quick Pick missed. " + formatRepSwing(QUICK_PICK_WIN, QUICK_PICK_LOSS),
      );
    }, 1700);

    window.setTimeout(() => {
      rotateQuickPick("interaction");
    }, 900);
  }
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent pb-4 pt-[calc(1rem+env(safe-area-inset-top))] text-white sm:pb-5 sm:pt-5">
      <div className="arena-shell screen-safe-bottom space-y-5">
        <AppHeader subtitle="Game Room · Watch together and react live." rightAriaLabel="Account" />
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-black/35 px-3 text-xs font-black uppercase tracking-[0.12em] text-gray-300 transition hover:text-lime-200"
        >
          ← Back to Match Hub
        </button>
        {worldCupMatch ? (
          <div className="flex flex-wrap gap-2">
            {makeCallHref ? (
              <Link
                href={makeCallHref}
                className="inline-flex min-h-10 items-center rounded-xl border border-lime-300/45 bg-lime-400/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-lime-200"
              >
                Make Call
              </Link>
            ) : null}
            <button
              type="button"
              onClick={shareGameRoom}
              className="inline-flex min-h-10 items-center rounded-xl border border-purple-300/45 bg-purple-500/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-purple-200"
            >
              Share Match Room
            </button>
          </div>
        ) : null}
        {!isWorldCupRoom && simplifiedRoom ? (
          <p className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-semibold text-gray-300">
            This room is for World Cup matches. Pick a match from the Schedule or Match Hub.
          </p>
        ) : null}
        <ArenaScoreboard
          game={game}
          worldCupMatch={worldCupMatch}
          simplifiedRoom={simplifiedRoom && isWorldCupRoom}
          showQuickPicks={!simplifiedRoom && !isWorldCupRoom}
          quickPickQuestions={quickPickQueue}
          quickPickSelections={quickPickSelections}
          quickPickResults={quickPickResults}
          savingQuickPickKey={savingQuickPickKey}
          quickPickMessage={quickPickMessage}
          quickPickCrowdLine={quickPickCrowdLine}
          onQuickPick={lockQuickPick}
        />
        <ArenaTabs activeTab={activeTab} onSelect={setActiveTab} earlyCallCount={totalFeedCount} simplifiedRoom={simplifiedRoom} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="space-y-4">
            {activeTab === "calls" && (
              <CallsPanel
                gameId={gameId}
                isAuthenticated={isAuthenticated}
                takes={visibleTakes}
                totalCount={totalFeedCount}
                reactionLoadingTakeId={reactionLoadingTakeId}
                reactions={takeReactions}
                replyLoadingTakeId={replyLoadingTakeId}
                repliesByTake={repliesByTake}
                expandedReplyTakeIds={expandedReplyTakeIds}
                replyDraftByTake={replyDraftByTake}
                replyingToReplyByTake={replyingToReplyByTake}
                newTakeText={newTakeText}
                isLockingTake={isLockingTake}
                takesMessage={takesMessage}
                postToFeedNotice={postToFeedNotice}
                onNewTakeTextChange={setNewTakeText}
                onLockIt={lockIt}
                onReact={reactToLockedTake}
                onToggleReplies={toggleReplies}
                onReplyDraftChange={(takeId, text) => {
                  setReplyDraftByTake((current) => ({ ...current, [takeId]: text }));
                }}
                onSubmitReply={submitReply}
                onReplyToReply={(takeId, replyId) => {
                  setReplyingToReplyByTake((current) => ({
                    ...current,
                    [takeId]: current[takeId] === replyId ? null : replyId,
                  }));
                }}
              />
            )}
            {activeTab === "control-room" && !simplifiedRoom ? <ControlRoomPanel game={game} /> : null}
          </section>

          <aside className="space-y-4">
            {activeTab !== "control-room" && !simplifiedRoom ? <ControlRoomPanel game={game} /> : null}
            <ArenaVibePanel />
            {simplifiedRoom ? (
              <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
                <p className="text-sm font-semibold text-gray-300">
                  Invite your people to this Game Room, or share the match link with friends and family.
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function parseWorldCupMatchFromGameId(gameId: string) {
  const normalized = gameId.match(/^wc-2026-(\d+)$/);
  if (!normalized) {
    return null;
  }

  return getWorldCupMatchById(Number(normalized[1]));
}

function ArenaScoreboard({
  game,
  worldCupMatch,
  simplifiedRoom,
  showQuickPicks,
  quickPickQuestions,
  quickPickSelections,
  quickPickResults,
  savingQuickPickKey,
  quickPickMessage,
  quickPickCrowdLine,
  onQuickPick,
}: {
  game: Game | null;
  worldCupMatch: ReturnType<typeof getWorldCupMatchById>;
  simplifiedRoom: boolean;
  showQuickPicks: boolean;
  quickPickQuestions: QuickPickQuestion[];
  quickPickSelections: Record<string, string>;
  quickPickResults: Record<string, "pending" | "hit" | "miss">;
  savingQuickPickKey: string | null;
  quickPickMessage: string;
  quickPickCrowdLine: string;
  onQuickPick: (question: QuickPickQuestion, selectedSide: string) => void;
}) {
  const awayTeam = game?.away_team ?? "AWAY";
  const homeTeam = game?.home_team ?? "HOME";
  const awayScore = String(game?.away_score ?? 0);
  const homeScore = String(game?.home_score ?? 0);
  const status = game?.status ?? "scheduled";
  const statusLabel = status === "live" ? "LIVE" : status === "final" ? "FINAL" : "SCHEDULED";
  const period = game?.period ?? (status === "live" ? "LIVE" : status === "final" ? "Final" : "Pregame");
  const clock = status === "live" ? game?.clock ?? "--:--" : null;
  const watching = game?.watching_count ?? 0;
  const startsAt = game?.starts_at
    ? new Date(game.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "TBD";
  const rideCount = game?.ride_count ?? 0;
  const fadeCount = game?.fade_count ?? 0;
  const totalPicks = rideCount + fadeCount;
  const showCrowdSplit = !simplifiedRoom || totalPicks > 0;
  const ridePct = totalPicks > 0 ? Math.round((rideCount / totalPicks) * 100) : 50;
  const fadePct = 100 - ridePct;
  const stageLabel = worldCupMatch
    ? worldCupMatch.group === "KO"
      ? worldCupMatch.stage
      : `Group ${worldCupMatch.group}`
    : period;
  const venueLabel = worldCupMatch ? `${worldCupMatch.city} · ${worldCupMatch.venue}` : null;

  return (
    <section className="arena-scoreboard overflow-hidden rounded-[1.75rem] border border-white/10 p-4 pt-5 shadow-[0_26px_80px_rgba(0,0,0,0.56),0_0_34px_rgba(168,85,247,0.08)] sm:p-5">
      {worldCupMatch ? (
        <div className="mb-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">{stageLabel}</p>
          {venueLabel ? <p className="mt-1 text-xs font-semibold text-gray-400">{venueLabel}</p> : null}
        </div>
      ) : null}
      {status === "scheduled" && simplifiedRoom ? (
        <p className="mb-4 rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-center text-sm font-semibold text-gray-300">
          Live updates will appear here when this match kicks off.
        </p>
      ) : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 text-center sm:gap-3">
        <ScoreTeam team={awayTeam} score={awayScore} label={`Team ${awayTeam}`} tone="ride" />

        <div className="pb-1">
          <span className="rounded-md border border-red-400/60 bg-red-500/10 px-2.5 py-1 text-xs font-black uppercase text-red-300">
            {statusLabel}
          </span>
          <p className="mt-3 text-xs font-black uppercase text-purple-300">{worldCupMatch ? stageLabel : period}</p>
          {clock ? <p className="scoreboard-number mt-1 text-4xl text-white">{clock}</p> : null}
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300">
            <span className="h-2 w-2 rounded-full bg-lime-400" />{" "}
            {status === "scheduled"
              ? `Kickoff ${startsAt}`
              : status === "live" && SHOW_FAKE_LIVE_ACTIVITY && watching > 0
                ? `${formatCompact(watching)} in room`
                : status === "live"
                  ? "Match live"
                  : "Final whistle"}
          </p>
          <p className="text-[10px] font-black uppercase text-gray-500">{status === "scheduled" ? "Upcoming" : status === "final" ? "Final" : "Live"}</p>
          <span className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/60 text-[10px] font-black text-gray-300">
            VS
          </span>
        </div>

        <ScoreTeam team={homeTeam} score={homeScore} label={`Team ${homeTeam}`} tone="fade" />
      </div>

      {showCrowdSplit ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-xs font-black uppercase">
            <span className="text-lime-300">{ridePct}% Riding {awayTeam}</span>
            <span className="text-purple-300">{fadePct}% Fading {homeTeam}</span>
          </div>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/10">
            <div className="bg-gradient-to-r from-lime-400 to-lime-300" style={{ width: `${ridePct}%` }} />
            <div className="w-3 bg-white/30" />
            <div className="bg-gradient-to-r from-purple-700 to-purple-400" style={{ width: `${Math.max(fadePct - 3, 0)}%` }} />
          </div>
        </div>
      ) : null}

      {showQuickPicks ? (
      <QuickPickPanel
        questions={quickPickQuestions}
        selections={quickPickSelections}
        results={quickPickResults}
        savingQuestionKey={savingQuickPickKey}
        message={quickPickMessage}
        crowdLine={quickPickCrowdLine}
        onPick={onQuickPick}
      />
      ) : null}

      {!simplifiedRoom ? (
      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/50 p-3.5 sm:grid-cols-[0.8fr_1.25fr_0.85fr] sm:items-center">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400">Crowd Split</p>
          <p className="mt-1 text-2xl font-black text-lime-300">{ridePct}% / {fadePct}%</p>
          <p className="text-[10px] font-black uppercase text-red-300">{status === "scheduled" ? "Match room warming up" : status === "final" ? "Crowd settled" : "Match room live"}</p>
        </div>
        <div className="border-y border-white/10 py-3 text-center sm:border-x sm:border-y-0 sm:px-4 sm:py-0">
          <p className="text-[10px] font-black uppercase text-gray-400">Momentum</p>
          {status === "live" ? <Sparkline /> : null}
          <p className="mt-1 text-xs font-black uppercase text-lime-300">
            {status === "live" ? "Crowd leaning " + (ridePct >= fadePct ? awayTeam : homeTeam) : status === "scheduled" ? "Pregame read loading" : "Final books closed"}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black uppercase text-gray-400">Game State</p>
          <p className="scoreboard-number mt-1 text-4xl text-purple-300">{status === "scheduled" ? "PRE" : status === "final" ? "FIN" : "LIVE"}</p>
        </div>
      </div>
      ) : null}
    </section>
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function QuickPickPanel({
  questions,
  selections,
  results,
  savingQuestionKey,
  message,
  crowdLine,
  onPick,
}: {
  questions: QuickPickQuestion[];
  selections: Record<string, string>;
  results: Record<string, "pending" | "hit" | "miss">;
  savingQuestionKey: string | null;
  message: string;
  crowdLine: string;
  onPick: (question: QuickPickQuestion, selectedSide: string) => void;
}) {
  return (
    <section className="mt-4 rounded-xl border border-white/10 bg-black/45 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Quick Calls</p>
          <p className="mt-1 text-[11px] font-bold text-gray-300">
            {SHOW_REP_SYSTEM_PUBLICLY ? `${formatRepSwing(QUICK_PICK_WIN, QUICK_PICK_LOSS)} REP · match loop` : "Quick calls for this match"}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300">
          Match Queue
        </span>
      </div>

      <div className="mt-2.5 grid gap-2">
        {questions.map((question) => {
          const lockedSelection = selections[question.key];
          const result = results[question.key] ?? null;
          const isSaving = savingQuestionKey === question.key;

          return (
            <div key={question.key} className="rounded-lg border border-white/10 bg-black/35 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white">{question.questionText}</p>
                {lockedSelection ? (
                  <span className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-0.5 text-[9px] font-black uppercase text-gray-200">
                    {result === "pending" ? "Pending" : result === "hit" ? "Hit" : result === "miss" ? "Miss" : "Locked"}
                  </span>
                ) : null}
              </div>

              {lockedSelection ? (
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-lime-300">
                  You picked {lockedSelection}
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {question.options.map((option) => (
                    <QuickPickButton
                      key={option.value}
                      label={option.label}
                      tone={option.tone}
                      isLocked={false}
                      disabled={isSaving}
                      onClick={() => onPick(question, option.value)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
        {crowdLine || "Crowd flips fast. Keep firing."}
      </p>
      <p className="mt-1 text-center text-[10px] font-bold text-gray-500">
        {message || "Quick Calls rotate automatically."}
      </p>
    </section>
  );
}

function QuickPickButton({
  label,
  tone,
  isLocked,
  disabled,
  onClick,
}: {
  label: string;
  tone: "green" | "purple";
  isLocked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const toneClass =
    tone === "green"
      ? "border-lime-300/45 text-lime-300 shadow-[0_0_18px_rgba(132,204,22,0.08)]"
      : "border-purple-300/45 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.1)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-10 rounded-xl border bg-black/35 px-3 text-xs font-black uppercase tracking-[0.12em] transition active:scale-[0.98] disabled:cursor-not-allowed ${toneClass} ${
        isLocked ? "bg-white/[0.08] ring-2 ring-white/10" : "hover:-translate-y-0.5 hover:bg-white/[0.04]"
      }`}
    >
      {isLocked ? `${label} ✓` : label}
    </button>
  );
}

function getQuickPickQuestions({
  game,
  awayTeam,
  homeTeam,
  recentKeys,
}: {
  game: Game | null;
  awayTeam: string;
  homeTeam: string;
  recentKeys: string[];
}) {
  const status = game?.status ?? "scheduled";
  const period = (game?.period ?? "").toUpperCase();
  const clock = game?.clock ?? "";
  const awayScore = game?.away_score ?? 0;
  const homeScore = game?.home_score ?? 0;
  const spread = Math.abs(awayScore - homeScore);
  const lateGame = status === "live" && (period.includes("Q4") || period.includes("OT") || clock.startsWith("1:") || clock.startsWith("0:"));
  const closeGame = spread <= 6;
  const blowout = spread >= 14;
  const leader = awayScore >= homeScore ? awayTeam : homeTeam;

  const pool: QuickPickQuestion[] = [];

  if (status === "scheduled") {
    pool.push(
      buildPick("pregame-first-score", "scoring", "Who scores first?", awayTeam, homeTeam),
      buildPick("pregame-upset", "outcome", "Upset incoming?", "Yes", "No"),
      buildPick("pregame-trap", "tempo", "Trap game tonight?", "Trap", "Safe"),
      buildPick("pregame-crowd", "momentum", "Crowd switching sides before kickoff?", "Switching", "Holding"),
      buildPick("pregame-starter", "clutch", "Hot start from " + awayTeam + "?", "Yes", "No"),
    );
  }

  if (status === "live") {
    pool.push(
      buildPick("live-next-score", "scoring", "Next goal by?", awayTeam, homeTeam),
      buildPick("live-turnover", "tempo", "Next big chance?", awayTeam, homeTeam),
      buildPick("live-run", "momentum", "Momentum swing incoming?", "Yes", "No"),
      buildPick("live-clutch", "clutch", "Clutch moment incoming?", "Yes", "No"),
      buildPick("live-crowd", "momentum", "Crowd switching sides?", "Switch", "Stay"),
    );

    if (closeGame) {
      pool.push(
        buildPick("live-ot", "outcome", "OT incoming?", "Yes", "No"),
        buildPick("live-close", "clutch", "Who closes this?", awayTeam, homeTeam),
        buildPick("live-last-shot", "clutch", "Late winner incoming?", "Yes", "No"),
      );
    }

    if (blowout) {
      pool.push(
        buildPick("live-comeback", "outcome", "Comeback alive?", "Alive", "Cooked"),
        buildPick("live-bench", "tempo", "Game already decided?", "Yes", "No"),
        buildPick("live-checked-out", "momentum", "Crowd checked out?", "Checked out", "Still loud"),
      );
    }

    if (!closeGame && !blowout) {
      pool.push(
        buildPick("live-flip", "momentum", "Game flipped already?", "Flipped", "Still steady"),
        buildPick("live-winner", "outcome", "Match winner incoming?", "Yes", "No"),
      );
    }

    if (lateGame) {
      pool.push(
        buildPick("live-late-ot", "outcome", "OT incoming late?", "Yes", "No"),
        buildPick("live-late-shot", "clutch", "Big moment from " + leader + "?", "Yes", "No"),
      );
    }
  }

  if (status === "final") {
    pool.push(
      buildPick("final-lock", "outcome", "" + leader + " closes this clean?", "Yes", "No"),
      buildPick("final-next", "momentum", "Next match same energy?", "Run it back", "Reset"),
      buildPick("final-crowd", "tempo", "Crowd still talking?", "Still loud", "Quiet now"),
    );
  }

  const deduped = pool.filter((question, index) => pool.findIndex((candidate) => candidate.key === question.key) === index);
  const withoutRecent = deduped.filter((question) => !recentKeys.includes(question.key));

  if (withoutRecent.length >= 3) {
    return withoutRecent;
  }

  return deduped;
}

function getQuickPickCrowdLine(game: Game | null, question?: QuickPickQuestion) {
  const awayTeam = game?.away_team ?? "Away";
  const homeTeam = game?.home_team ?? "Home";
  const lines = [
    "Everybody riding " + awayTeam + " now",
    "Bro this game flipped fast",
    "No way they choke this",
    "This crowd changes every attack",
    "" + homeTeam + " fans getting loud again",
  ];

  if (!question) {
    return lines[0];
  }

  const index = Math.abs(hashText(question.key + question.questionText)) % lines.length;
  return lines[index];
}

function buildPick(key: string, pickType: QuickPickQuestion["pickType"], questionText: string, left: string, right: string): QuickPickQuestion {
  return {
    key,
    pickType,
    questionText,
    options: [
      { label: left, value: left, tone: "green" },
      { label: right, value: right, tone: "purple" },
    ],
  };
}

function hashText(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

function toQuickPickKey(questionText: string) {
  return questionText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ScoreTeam({
  team,
  score,
  label,
  tone,
}: {
  team: string;
  score: string;
  label: string;
  tone: "ride" | "fade";
}) {
  const toneClass = tone === "ride" ? "text-lime-300" : "text-purple-300";

  return (
    <div>
      <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${toneClass}`}>{label}</p>
      <p className="sports-display mt-2 text-4xl leading-none text-white sm:mt-3 sm:text-5xl">{team}</p>
      <p className="scoreboard-number mt-2 text-[3.65rem] text-white sm:text-7xl">{score}</p>
    </div>
  );
}

function ArenaTabs({
  activeTab,
  onSelect,
  earlyCallCount,
  simplifiedRoom,
}: {
  activeTab: ArenaTab;
  onSelect: (tab: ArenaTab) => void;
  earlyCallCount: number;
  simplifiedRoom: boolean;
}) {
  const tabs: { id: ArenaTab; label: string; count?: string }[] = simplifiedRoom
    ? [{ id: "calls", label: "Match Room", count: String(earlyCallCount) }]
    : [
        { id: "calls", label: "Early Call Feed", count: String(earlyCallCount) },
        { id: "control-room", label: "Control Room" },
      ];

  return (
    <nav className={`grid gap-1 rounded-[1.5rem] border border-white/10 bg-black/35 p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur ${tabs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={`min-h-12 rounded-2xl border px-1 text-[9px] font-black uppercase leading-tight transition active:scale-95 min-[390px]:text-[10px] sm:text-xs ${
            activeTab === tab.id
              ? "border-purple-300/60 bg-purple-500/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.16),inset_0_-2px_0_rgba(168,85,247,0.95)]"
              : "border-transparent text-gray-500"
          }`}
        >
          {tab.label}
          {tab.count && (
            <span className="ml-1 rounded-full border border-white/10 bg-white/10 px-1.5 py-0.5 text-[9px] text-gray-300">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

function CallsPanel({
  gameId,
  isAuthenticated,
  takes,
  totalCount,
  reactionLoadingTakeId,
  reactions,
  replyLoadingTakeId,
  repliesByTake,
  expandedReplyTakeIds,
  replyDraftByTake,
  replyingToReplyByTake,
  newTakeText,
  isLockingTake,
  takesMessage,
  postToFeedNotice,
  onNewTakeTextChange,
  onLockIt,
  onReact,
  onToggleReplies,
  onReplyDraftChange,
  onSubmitReply,
  onReplyToReply,
}: {
  gameId: string;
  isAuthenticated: boolean;
  takes: ArenaTake[];
  totalCount: number;
  reactionLoadingTakeId: string | null;
  reactions: Record<string, TakeReaction["reaction"]>;
  replyLoadingTakeId: string | null;
  repliesByTake: Record<string, TakeReplyWithAuthor[]>;
  expandedReplyTakeIds: Record<string, boolean>;
  replyDraftByTake: Record<string, string>;
  replyingToReplyByTake: Record<string, string | null>;
  newTakeText: string;
  isLockingTake: boolean;
  takesMessage: string;
  postToFeedNotice: string;
  onNewTakeTextChange: (text: string) => void;
  onLockIt: () => void;
  onReact: (takeId: string, reaction: Side) => void;
  onToggleReplies: (takeId: string) => void;
  onReplyDraftChange: (takeId: string, text: string) => void;
  onSubmitReply: (takeId: string) => void;
  onReplyToReply: (takeId: string, replyId: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">Your Call</p>
        <p className="mt-1 text-sm font-semibold text-gray-300">Make a simple call for this match. After the final whistle, we&apos;ll show if you were right.</p>
        <textarea
          value={newTakeText}
          onChange={(event) => onNewTakeTextChange(event.target.value)}
          placeholder="Drop your match call..."
          maxLength={160}
          className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-sm font-semibold text-white outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-gray-400">{newTakeText.length}/160</p>
          <button
            type="button"
            onClick={onLockIt}
            disabled={isLockingTake}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-lime-300/50 bg-lime-400/10 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-60"
          >
            {isLockingTake ? "Locking..." : "Lock It"}
          </button>
        </div>
        {!isAuthenticated ? (
          <p className="mt-2 text-xs font-semibold text-gray-400">
            Save your call with a quick profile when you lock.{" "}
            <Link href={`/signup?next=${encodeURIComponent(`/game/${gameId}`)}`} className="font-black text-lime-300">
              Sign up
            </Link>{" "}
            or{" "}
            <Link href={`/login?next=${encodeURIComponent(`/game/${gameId}`)}`} className="font-black text-purple-300">
              log in
            </Link>
            .
          </p>
        ) : null}
        {takesMessage ? <p className="mt-2 text-xs font-semibold text-gray-300">{takesMessage}</p> : null}
      </div>

      {postToFeedNotice ? (
        <p className="px-1 text-[11px] font-semibold text-lime-300">{postToFeedNotice}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/80 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
            Match Room Feed <span className="text-gray-400">{totalCount}</span>
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Newest First</p>
        </div>
        <div className="max-h-[32rem] space-y-3 overflow-y-auto p-3">
          {!takes.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm font-semibold text-gray-300">No locked calls yet. Be first to lock one.</p>
            </div>
          ) : null}

          {takes.map((take) => {
            const ui = formatTakeForUI(take);
            const activeReaction = reactions[take.id];
            const replies = repliesByTake[take.id] ?? [];
            const isRepliesOpen = Boolean(expandedReplyTakeIds[take.id]);
            const replyDraft = replyDraftByTake[take.id] ?? "";
            const replyingToReplyId = replyingToReplyByTake[take.id] ?? null;

            return (
        <article key={take.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <Link href={getReceiptHref(ui.handle)} className="text-sm font-black text-white transition hover:text-lime-200">
              {ui.handle}
            </Link>
            <span className="rounded-md border border-purple-300/35 bg-purple-500/10 px-2 py-1 text-[10px] font-black uppercase text-purple-200">
              Locked
            </span>
          </div>
          <p className="mt-3 text-lg font-black leading-tight text-gray-100">{take.take_text}</p>
          <div className="mt-4 flex items-center justify-between text-sm font-black">
            <span className="text-lime-300">👍 {take.ride_count}</span>
            <span className="text-purple-300">👎 {take.fade_count}</span>
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              <ArenaChoiceButton
                label={activeReaction === "ride" ? "Riding" : "Ride"}
                tone="ride"
                disabled={reactionLoadingTakeId === take.id}
                onClick={() => onReact(take.id, "ride")}
              />
              <ArenaChoiceButton
                label={activeReaction === "fade" ? "Fading" : "Fade"}
                tone="fade"
                disabled={reactionLoadingTakeId === take.id}
                onClick={() => onReact(take.id, "fade")}
              />
            </div>
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => onToggleReplies(take.id)}
              className="text-xs font-black uppercase tracking-[0.1em] text-purple-300"
            >
              {isRepliesOpen ? "Hide replies" : "View replies"} {take.reply_count ? `${take.reply_count}` : ""}
            </button>
            {isRepliesOpen ? (
              <div className="mt-3 space-y-2">
                {replies.map((reply) => {
                  const replyHandle = reply.author?.username ? `@${reply.author.username.replace(/^@/, "")}` : "@Talker";
                  return (
                    <div key={reply.id} className="rounded-lg border border-white/10 bg-black/45 p-2">
                      <p className="text-xs font-black text-white">{replyHandle}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-200">{reply.reply_text}</p>
                      <button
                        type="button"
                        onClick={() => onReplyToReply(take.id, reply.id)}
                        className={`mt-1 text-[10px] font-black uppercase tracking-[0.1em] ${
                          replyingToReplyId === reply.id ? "text-lime-300" : "text-gray-400"
                        }`}
                      >
                        Reply
                      </button>
                    </div>
                  );
                })}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    value={replyDraft}
                    onChange={(event) => onReplyDraftChange(take.id, event.target.value)}
                    placeholder={replyingToReplyId ? "Replying to comment..." : "Reply"}
                    className="min-h-10 rounded-lg border border-white/10 bg-black/55 px-3 text-sm font-semibold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onSubmitReply(take.id)}
                    disabled={replyLoadingTakeId === take.id}
                    className="min-h-10 rounded-lg border border-purple-300/45 bg-purple-500/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-purple-100 disabled:opacity-60"
                  >
                    {replyLoadingTakeId === take.id ? "Posting..." : "Reply"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ControlRoomPanel({ game }: { game: Game | null }) {
  const rideCount = game?.ride_count ?? 0;
  const fadeCount = game?.fade_count ?? 0;
  const totalPicks = rideCount + fadeCount;
  const ridePct = totalPicks > 0 ? Math.round((rideCount / totalPicks) * 100) : 50;
  const fadePct = 100 - ridePct;
  const status = game?.status ?? "scheduled";

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <PanelHeader title="Control Room" />
      <p className="mt-4 text-[10px] font-black uppercase text-gray-400">Crowd Sentiment</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div>
          <p className="scoreboard-number text-4xl text-lime-300">{ridePct}%</p>
          <p className="text-[10px] font-black uppercase text-lime-300">Riding {game?.away_team ?? "AWAY"}</p>
        </div>
        <div className="relative h-16 w-16 rounded-full bg-[conic-gradient(#84cc16_0_62%,#a855f7_62%_100%)]">
          <div className="absolute inset-3 rounded-full bg-black" />
        </div>
        <div className="text-right">
          <p className="scoreboard-number text-4xl text-purple-300">{fadePct}%</p>
          <p className="text-[10px] font-black uppercase text-purple-300">Fading {game?.home_team ?? "HOME"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/10 py-4">
        <StatBlock label={status === "live" ? "Ride Surge" : "Ride Side"} value={String(ridePct) + "%"} detail={status === "live" ? "Crowd now" : "Current split"} tone="ride" />
        <StatBlock label={status === "live" ? "Fade Surge" : "Fade Side"} value={String(fadePct) + "%"} detail={status === "live" ? "Crowd now" : "Current split"} tone="fade" />
      </div>

      <div className="mt-4 space-y-3">
        <SignalRow icon="◉" label="Crowd Confidence" value="85%" note="Very high" tone="ride" />
        <SignalRow icon="🔥" label="Overcommitment" value={`${Math.max(game?.ride_count ?? 0, game?.fade_count ?? 0)} picks`} note="Crowd side" tone="ride" />
        <SignalRow icon="ϟ" label={status === "live" ? "Momentum Shift" : "Room Lean"} value={[game?.away_team ?? "AWAY", game?.home_team ?? "HOME"].join(" ↔ ")} note={status === "live" ? "Game-state" : "Pregame read"} tone="ride" />
        <SignalRow icon="☿" label="Upset Threat" value="68%" note="High" tone="fade" />
      </div>
    </section>
  );
}

// Retained for future re-enable when rankings return to Live Arena navigation.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TopTalkersPanel() {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <PanelHeader title="Top Talkers" />
      <div className="mt-4 space-y-2">
        {topTalkers.map((talker) => (
          <div key={talker.handle} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs font-black text-gray-300">
              {talker.rank}
            </span>
            <Link href={getReceiptHref(talker.handle)} className="rounded-full transition hover:scale-105 active:scale-95" aria-label={` receipts`}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-lime-300 via-purple-500 to-black text-[10px] font-black text-white">
                {talker.avatar}
              </span>
            </Link>
            <Link href={getReceiptHref(talker.handle)} className="truncate text-sm font-black text-white transition hover:text-lime-200">
              {talker.handle}
            </Link>
            <p className="text-xs font-black text-lime-300">🔥 {talker.heat}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArenaVibePanel() {
  return (
    <section className="rounded-[1.5rem] border border-purple-300/35 bg-purple-500/10 p-5 text-center shadow-[0_0_34px_rgba(168,85,247,0.16)]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-200">Match Room Vibe</p>
      <p className="sports-display mt-2 text-5xl italic leading-none text-purple-300">Pumped ⚽</p>
      <p className="mt-3 text-sm font-semibold text-gray-300">World Cup energy is building.</p>
    </section>
  );
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="sports-display text-2xl italic leading-none text-white">
        <span className="text-lime-300">●</span> {title}
      </h3>
      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-lime-300">
        <span className="h-2 w-2 rounded-full bg-lime-400" /> Live
      </span>
    </div>
  );
}

function StatBlock({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Side;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400">{label}</p>
      <p className={`scoreboard-number mt-1 text-3xl ${tone === "ride" ? "text-lime-300" : "text-purple-300"}`}>
        {value}
      </p>
      <p className="text-[10px] font-black uppercase text-gray-500">{detail}</p>
    </div>
  );
}

function SignalRow({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  note: string;
  tone: Side;
}) {
  const toneClass = tone === "ride" ? "text-lime-300" : "text-purple-300";

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-xs font-black uppercase">
      <span className={toneClass}>{icon}</span>
      <span className="truncate text-gray-400">{label}</span>
      <span className={toneClass}>{value}</span>
      <span className="text-[10px] text-gray-500">{note}</span>
    </div>
  );
}

function ArenaChoiceButton({
  label,
  tone,
  disabled = false,
  onClick,
}: {
  label: string;
  tone: Side;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 rounded-xl border text-sm font-black uppercase transition active:scale-95 disabled:opacity-60 ${
        tone === "ride"
          ? "border-lime-300/45 bg-lime-400/5 text-lime-300"
          : "border-purple-300/55 bg-purple-500/10 text-purple-300"
      }`}
    >
      {label}
    </button>
  );
}

function getReceiptHref(handle: string) {
  return "/receipts/" + handle.replace("@", "").toLowerCase();
}

function Sparkline() {
  return (
    <svg aria-hidden="true" viewBox="0 0 140 42" className="mx-auto mt-2 h-11 w-full max-w-56">
      <defs>
        <linearGradient id="arenaSparklineGradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="58%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <polyline
        points="0,32 8,31 14,23 19,25 25,13 31,8 38,21 44,16 50,27 58,24 65,32 72,26 80,30 88,18 94,13 101,20 108,29 114,24 121,28 128,23 136,27"
        fill="none"
        stroke="url(#arenaSparklineGradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}
