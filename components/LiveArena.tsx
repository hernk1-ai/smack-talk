"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { formatRepSwing, QUICK_PICK_LOSS, QUICK_PICK_WIN } from "@/lib/engagement";
import { ACTIVE_GAME_ID, getGameById } from "@/lib/supabase/games";
import { createQuickPick, getMyQuickPicks } from "@/lib/supabase/quickPicks";
import type { Game } from "@/lib/supabase/types";

type ArenaTab = "chat" | "calls" | "control-room" | "top-talkers";
type Side = "ride" | "fade";

type ChatTake = {
  id: string;
  handle: string;
  avatar: string;
  timestamp: string;
  text: string;
  heat: number;
  tag?: Side;
};

type LiveCall = {
  handle: string;
  text: string;
  rides: string;
  fades: string;
  status: string;
};

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

const chatTakes: ChatTake[] = [
  {
    id: "talk-heavy",
    handle: "@TalkHeavy23",
    avatar: "TH",
    timestamp: "1m ago",
    text: "Bro they can't guard anybody.",
    heat: 128,
  },
  {
    id: "mid-range",
    handle: "@MidRange",
    avatar: "MR",
    timestamp: "1m ago",
    text: "Lmao everybody switched sides.",
    heat: 96,
  },
  {
    id: "fade-king",
    handle: "@FadeKing",
    avatar: "FK",
    timestamp: "just now",
    text: "That was a terrible shot.",
    heat: 212,
    tag: "fade",
  },
  {
    id: "hoop-dreams",
    handle: "@HoopDreams",
    avatar: "HD",
    timestamp: "just now",
    text: "He's cooking them right now.",
    heat: 74,
    tag: "ride",
  },
  {
    id: "no-mercy",
    handle: "@NoMercy",
    avatar: "NM",
    timestamp: "just now",
    text: "No way they hold this lead.",
    heat: 52,
  },
];

const liveCalls: LiveCall[] = [
  {
    handle: "@BucketsOnly",
    text: "This crowd got quiet fast.",
    rides: "2.1K",
    fades: "842",
    status: "Locked",
  },
  {
    handle: "@FadeKing",
    text: "They're settling for bad looks now.",
    rides: "488",
    fades: "1.4K",
    status: "Fade",
  },
  {
    handle: "@HoopDreams",
    text: "Bench just flipped this game.",
    rides: "912",
    fades: "215",
    status: "Ride",
  },
];

const topTalkers: TopTalker[] = [
  { rank: 1, handle: "@TalkHeavy23", heat: "3.6K", avatar: "TH" },
  { rank: 2, handle: "@BucketsOnly", heat: "3.1K", avatar: "BO" },
  { rank: 3, handle: "@FadeKing", heat: "2.7K", avatar: "FK" },
  { rank: 4, handle: "@MidRange", heat: "2.4K", avatar: "MR" },
  { rank: 5, handle: "@HoopDreams", heat: "2.1K", avatar: "HD" },
];

export function LiveArena({ gameId = ACTIVE_GAME_ID, onBack }: { gameId?: string; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<ArenaTab>("chat");
  const [game, setGame] = useState<Game | null>(null);
  const [quickPickSelections, setQuickPickSelections] = useState<Record<string, string>>({});
  const [quickPickResults, setQuickPickResults] = useState<Record<string, "pending" | "hit" | "miss">>({});
  const [quickPickMessage, setQuickPickMessage] = useState("");
  const [quickPickCrowdLine, setQuickPickCrowdLine] = useState("");
  const [savingQuickPickKey, setSavingQuickPickKey] = useState<string | null>(null);
  const [callChoices, setCallChoices] = useState<Record<string, Side>>({});
  const [quickPickQueue, setQuickPickQueue] = useState<QuickPickQuestion[]>([]);
  const [quickPickRecentKeys, setQuickPickRecentKeys] = useState<string[]>([]);
  const awayTeam = game?.away_team ?? "AWAY";
  const homeTeam = game?.home_team ?? "HOME";

  useEffect(() => {
    let isMounted = true;

    async function loadGameAndQuickPicks() {
      const [{ game: loadedGame }, { quickPicks }] = await Promise.all([getGameById(gameId), getMyQuickPicks(gameId)]);

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
    }

    loadGameAndQuickPicks();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  useEffect(() => {
    if (!quickPickQueue.length || savingQuickPickKey) {
      return;
    }

    const delayMs = game?.status === "live" ? 14000 : game?.status === "scheduled" ? 22000 : 26000;
    const timer = window.setTimeout(() => {
      rotateQuickPick("timer");
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [game?.status, quickPickQueue, quickPickSelections, savingQuickPickKey]);

  function rotateQuickPick(reason: "timer" | "interaction") {
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
  }

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
        <ArenaHeader onBack={onBack} game={game} />
        <ArenaScoreboard
          game={game}
          quickPickQuestions={quickPickQueue}
          quickPickSelections={quickPickSelections}
          quickPickResults={quickPickResults}
          savingQuickPickKey={savingQuickPickKey}
          quickPickMessage={quickPickMessage}
          quickPickCrowdLine={quickPickCrowdLine}
          onQuickPick={lockQuickPick}
        />
        <ArenaTabs activeTab={activeTab} onSelect={setActiveTab} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="space-y-4">
            {activeTab === "chat" && <ChatPanel />}
            {activeTab === "calls" && (
              <CallsPanel
                choices={callChoices}
                onChoose={(callId, side) => {
                  setCallChoices((current) => ({ ...current, [callId]: side }));
                  setQuickPickMessage(side === "ride" ? "You rode that call." : "You faded that call.");
                }}
              />
            )}
            {activeTab === "control-room" && <ControlRoomPanel game={game} />}
            {activeTab === "top-talkers" && <TopTalkersPanel />}
          </section>

          <aside className="space-y-4">
            {activeTab !== "control-room" && <ControlRoomPanel game={game} />}
            {activeTab !== "top-talkers" && <TopTalkersPanel />}
            <ArenaVibePanel />
          </aside>
        </div>
      </div>
    </main>
  );
}

function ArenaHeader({ onBack, game }: { onBack: () => void; game: Game | null }) {
  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[1.5rem] border border-white/10 bg-black/30 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.3)] backdrop-blur sm:gap-3 sm:p-3">
      <button
        type="button"
        onClick={onBack}
        className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/45 text-2xl font-black text-white shadow-[0_14px_34px_rgba(0,0,0,0.34)] transition active:scale-95"
        aria-label="Back to feed"
      >
        ‹
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <SmackTalkLogo size={54} />
        <div className="min-w-0">
          <h1 className="brand-lockup text-[2rem] leading-[0.82] sm:text-4xl">
            <span className="block text-white">Smack</span>
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
              Talk
            </span>
          </h1>
          <p className="mt-1 hidden items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-gray-300 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(132,204,22,0.75)]" />
            {formatCompact(game?.watching_count ?? 0)} <span className="text-gray-500">{game?.status === "live" ? "Talkers Live" : game?.status === "final" ? "Crowd settled" : "Pregame lobby"}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <HeaderIcon label="Notifications" badge="3">
          ♧
        </HeaderIcon>
        <HeaderIcon label="Share">⇧</HeaderIcon>
        <HeaderIcon label="More">•••</HeaderIcon>
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
      className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-black/45 text-lg text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition active:scale-95 sm:h-12 sm:w-12 sm:text-xl"
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

function ArenaScoreboard({
  game,
  quickPickQuestions,
  quickPickSelections,
  quickPickResults,
  savingQuickPickKey,
  quickPickMessage,
  quickPickCrowdLine,
  onQuickPick,
}: {
  game: Game | null;
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
  const ridePct = totalPicks > 0 ? Math.round((rideCount / totalPicks) * 100) : 50;
  const fadePct = 100 - ridePct;

  return (
    <section className="arena-scoreboard overflow-hidden rounded-[1.75rem] border border-white/10 p-4 pt-5 shadow-[0_26px_80px_rgba(0,0,0,0.56),0_0_34px_rgba(168,85,247,0.08)] sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 text-center sm:gap-3">
        <ScoreTeam team={awayTeam} score={awayScore} label={`Team ${awayTeam}`} tone="ride" />

        <div className="pb-1">
          <span className="rounded-md border border-red-400/60 bg-red-500/10 px-2.5 py-1 text-xs font-black uppercase text-red-300">
            {statusLabel}
          </span>
          <p className="mt-3 text-xs font-black uppercase text-purple-300">{period}</p>
          {clock ? <p className="scoreboard-number mt-1 text-4xl text-white">{clock}</p> : null}
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300">
            <span className="h-2 w-2 rounded-full bg-lime-400" /> {status === "scheduled" ? `Tipoff ${startsAt}` : status === "live" ? `${formatCompact(watching)} Talkers Live` : "Final whistle"}
          </p>
          <p className="text-[10px] font-black uppercase text-gray-500">{status === "scheduled" ? "Pregame" : status === "final" ? "Final" : period}</p>
          <span className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/60 text-[10px] font-black text-gray-300">
            VS
          </span>
        </div>

        <ScoreTeam team={homeTeam} score={homeScore} label={`Team ${homeTeam}`} tone="fade" />
      </div>

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

      <QuickPickPanel
        questions={quickPickQuestions}
        selections={quickPickSelections}
        results={quickPickResults}
        savingQuestionKey={savingQuickPickKey}
        message={quickPickMessage}
        crowdLine={quickPickCrowdLine}
        onPick={onQuickPick}
      />

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/50 p-3.5 sm:grid-cols-[0.8fr_1.25fr_0.85fr] sm:items-center">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400">Crowd Split</p>
          <p className="mt-1 text-2xl font-black text-lime-300">{ridePct}% / {fadePct}%</p>
          <p className="text-[10px] font-black uppercase text-red-300">{status === "scheduled" ? "Arena warming up" : status === "final" ? "Crowd settled" : "Arena heating up"}</p>
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
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Quick Picks</p>
          <p className="mt-1 text-[11px] font-bold text-gray-300">{formatRepSwing(QUICK_PICK_WIN, QUICK_PICK_LOSS)} REP · fast loop</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300">
          Live Queue
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
        {message || "Quick Picks rotate automatically."}
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
      buildPick("pregame-first-score", "scoring", "First bucket team?", awayTeam, homeTeam),
      buildPick("pregame-upset", "outcome", "Upset incoming?", "Yes", "No"),
      buildPick("pregame-trap", "tempo", "Trap game tonight?", "Trap", "Safe"),
      buildPick("pregame-crowd", "momentum", "Crowd switching sides before tip?", "Switching", "Holding"),
      buildPick("pregame-starter", "clutch", "Hot start from " + awayTeam + "?", "Yes", "No"),
    );
  }

  if (status === "live") {
    pool.push(
      buildPick("live-next-score", "scoring", "Next score by?", awayTeam, homeTeam),
      buildPick("live-turnover", "tempo", "Next turnover?", awayTeam, homeTeam),
      buildPick("live-run", "momentum", "10-0 run incoming?", "Yes", "No"),
      buildPick("live-clutch", "clutch", "Clutch shot incoming?", "Yes", "No"),
      buildPick("live-crowd", "momentum", "Crowd switching sides?", "Switch", "Stay"),
    );

    if (closeGame) {
      pool.push(
        buildPick("live-ot", "outcome", "OT incoming?", "Yes", "No"),
        buildPick("live-close", "clutch", "Who closes this?", awayTeam, homeTeam),
        buildPick("live-last-shot", "clutch", "Last shot incoming?", "Yes", "No"),
      );
    }

    if (blowout) {
      pool.push(
        buildPick("live-comeback", "outcome", "Comeback alive?", "Alive", "Cooked"),
        buildPick("live-bench", "tempo", "Empty the bench?", "Yes", "No"),
        buildPick("live-checked-out", "momentum", "Crowd checked out?", "Checked out", "Still loud"),
      );
    }

    if (!closeGame && !blowout) {
      pool.push(
        buildPick("live-flip", "momentum", "Game flipped already?", "Flipped", "Still steady"),
        buildPick("live-winner", "outcome", "Game winner incoming?", "Yes", "No"),
      );
    }

    if (lateGame) {
      pool.push(
        buildPick("live-late-ot", "outcome", "OT incoming late?", "Yes", "No"),
        buildPick("live-late-shot", "clutch", "Big shot from " + leader + "?", "Yes", "No"),
      );
    }
  }

  if (status === "final") {
    pool.push(
      buildPick("final-lock", "outcome", "" + leader + " closes this clean?", "Yes", "No"),
      buildPick("final-next", "momentum", "Next game same energy?", "Run it back", "Reset"),
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
    "This crowd changes every possession",
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

function ArenaTabs({ activeTab, onSelect }: { activeTab: ArenaTab; onSelect: (tab: ArenaTab) => void }) {
  const tabs: { id: ArenaTab; label: string; count?: string }[] = [
    { id: "chat", label: "Chat" },
    { id: "calls", label: "Calls", count: "132" },
    { id: "control-room", label: "Control Room" },
    { id: "top-talkers", label: "Top Talkers" },
  ];

  return (
    <nav className="grid grid-cols-4 gap-1 rounded-[1.5rem] border border-white/10 bg-black/35 p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur">
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

function ChatPanel() {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <PinnedCall />

      <div className="divide-y divide-white/10">
        {chatTakes.map((take) => (
          <ChatRow key={take.id} take={take} />
        ))}
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="text-sm font-black text-gray-400">⌛ Slow Mode is On</p>
        <p className="mt-1 text-xs font-semibold text-gray-500">You can send a message every 10 seconds.</p>
      </div>
    </section>
  );
}

function PinnedCall() {
  return (
    <article className="border-b border-purple-400/35 bg-purple-500/10 p-4 shadow-[0_0_34px_rgba(168,85,247,0.12)]">
      <div className="flex items-center justify-between gap-3">
        <p className="sports-display text-xl italic leading-none text-purple-200">📌 Pinned Call</p>
        <p className="min-w-0 truncate text-xs font-bold text-gray-300">
          @BucketsOnly <span className="text-purple-300">◆</span> <span className="text-gray-500">7m ago</span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 className="sports-display text-2xl italic leading-tight text-white sm:text-3xl">
          This crowd got quiet fast.
        </h2>
        <span className="text-3xl text-gray-300">›</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm font-black uppercase">
        <span className="rounded-md border border-purple-300/35 bg-purple-500/10 px-2 py-1 text-purple-200">Locked</span>
        <span className="text-lime-300">👍 2.1K Riding</span>
        <span className="text-purple-300">👎 842 Fading</span>
      </div>
    </article>
  );
}

function ChatRow({ take }: { take: ChatTake }) {
  return (
    <article className="grid grid-cols-[auto_1fr_auto] gap-3 p-4">
      <Link href={getReceiptHref(take.handle)} className="rounded-full transition hover:scale-105 active:scale-95" aria-label={` receipts`}>
        <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-lime-300 via-purple-500 to-black text-xs font-black text-white">
          {take.avatar}
        </span>
      </Link>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">
          <Link href={getReceiptHref(take.handle)} className="transition hover:text-lime-200">{take.handle}</Link> <span className="text-purple-300">◆</span>{" "}
          <span className="font-semibold text-gray-500">{take.timestamp}</span>
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-gray-200">{take.text}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-lime-300">🔥 {take.heat}</span>
          {take.tag && (
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${
                take.tag === "ride"
                  ? "border-lime-300/50 bg-lime-400/10 text-lime-300"
                  : "border-purple-300/50 bg-purple-500/10 text-purple-300"
              }`}
            >
              {take.tag}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center self-center rounded-full border border-white/10 bg-white/[0.03] text-xl text-gray-500 transition active:scale-95"
        aria-label={`React to ${take.handle}`}
      >
        ☺+
      </button>
    </article>
  );
}

function CallsPanel({ choices, onChoose }: { choices: Record<string, Side>; onChoose: (callId: string, side: Side) => void }) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      {liveCalls.map((call) => (
        <article key={call.handle} className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <Link href={getReceiptHref(call.handle)} className="text-sm font-black text-white transition hover:text-lime-200">
              {call.handle}
            </Link>
            <span className="rounded-md border border-purple-300/35 bg-purple-500/10 px-2 py-1 text-[10px] font-black uppercase text-purple-200">
              {call.status}
            </span>
          </div>
          <p className="mt-3 text-lg font-black leading-tight text-gray-100">{call.text}</p>
          <div className="mt-4 flex items-center justify-between text-sm font-black">
            <span className="text-lime-300">👍 {call.rides}</span>
            <span className="text-purple-300">👎 {call.fades}</span>
          </div>
          <div className="mt-4">
            {choices[call.handle] ? (
              <p className="rounded-xl border border-lime-300/35 bg-lime-400/10 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-lime-300">
                Choice locked: {choices[call.handle]}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <ArenaChoiceButton label="Ride" tone="ride" onClick={() => onChoose(call.handle, "ride")} />
                <ArenaChoiceButton label="Fade" tone="fade" onClick={() => onChoose(call.handle, "fade")} />
              </div>
            )}
          </div>
        </article>
      ))}
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
      <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-200">Arena Vibe</p>
      <p className="sports-display mt-2 text-5xl italic leading-none text-purple-300">Toxic ☠</p>
      <p className="mt-3 text-sm font-semibold text-gray-300">Emotions high. Watch your back.</p>
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

function ArenaChoiceButton({ label, tone, onClick }: { label: string; tone: Side; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl border text-sm font-black uppercase transition active:scale-95 ${
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
