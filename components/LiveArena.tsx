"use client";

import { useEffect, useState } from "react";
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

type TopTalker = {
  rank: number;
  handle: string;
  heat: string;
  avatar: string;
};

type QuickPickQuestion = {
  key: string;
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
    text: "Curry can’t buy a bucket right now 😂",
    heat: 128,
  },
  {
    id: "mid-range",
    handle: "@MidRange",
    avatar: "MR",
    timestamp: "1m ago",
    text: "Momentum is all LAL. Crowd smells blood.",
    heat: 96,
  },
  {
    id: "fade-king",
    handle: "@FadeKing",
    avatar: "FK",
    timestamp: "just now",
    text: "The Crowd is heavy on LAL... trap game incoming.",
    heat: 212,
    tag: "fade",
  },
  {
    id: "hoop-dreams",
    handle: "@HoopDreams",
    avatar: "HD",
    timestamp: "just now",
    text: "I’m riding with the crowd. LAL dont fold!",
    heat: 74,
    tag: "ride",
  },
  {
    id: "no-mercy",
    handle: "@NoMercy",
    avatar: "NM",
    timestamp: "just now",
    text: "Draymond about to change everything.",
    heat: 52,
  },
];

const liveCalls = [
  {
    handle: "@BucketsOnly",
    text: "LAL closing this. Warriors cooked.",
    rides: "2.1K",
    fades: "842",
    status: "Locked",
  },
  {
    handle: "@FadeKing",
    text: "Too much Crowd pressure. GSW still has one push.",
    rides: "488",
    fades: "1.4K",
    status: "Fade",
  },
  {
    handle: "@HoopDreams",
    text: "LAL defense is winning the last three minutes.",
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
  const [quickPickMessage, setQuickPickMessage] = useState("");
  const [savingQuickPickKey, setSavingQuickPickKey] = useState<string | null>(null);
  const awayTeam = game?.away_team ?? "LAL";
  const homeTeam = game?.home_team ?? "GSW";
  const quickPickQuestions = getQuickPickQuestions({
    awayTeam,
    homeTeam,
    awayScore: game?.away_score ?? 108,
    homeScore: game?.home_score ?? 103,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadGameAndQuickPicks() {
      const [{ game: loadedGame }, { quickPicks }] = await Promise.all([getGameById(gameId), getMyQuickPicks(gameId)]);

      if (!isMounted) {
        return;
      }

      setGame(loadedGame);
      setQuickPickSelections(
        Object.fromEntries((quickPicks ?? []).map((quickPick) => [toQuickPickKey(quickPick.question_text), quickPick.selected_side])),
      );
    }

    loadGameAndQuickPicks();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  async function lockQuickPick(question: QuickPickQuestion, selectedSide: string) {
    if (quickPickSelections[question.key] || savingQuickPickKey) {
      return;
    }

    setSavingQuickPickKey(question.key);
    setQuickPickMessage("");

    const { quickPick, error } = await createQuickPick({
      gameId,
      questionText: question.questionText,
      selectedSide,
    });

    setSavingQuickPickKey(null);

    if (error || !quickPick) {
      setQuickPickMessage(error?.message || "Could not save that quick pick.");
      return;
    }

    setQuickPickSelections((current) => ({
      ...current,
      [question.key]: quickPick.selected_side,
    }));
    setQuickPickMessage(`Quick Pick locked: ${question.questionText} · ${quickPick.selected_side} · ${formatRepSwing(QUICK_PICK_WIN, QUICK_PICK_LOSS)}`);
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent pb-4 pt-[calc(1rem+env(safe-area-inset-top))] text-white sm:pb-5 sm:pt-5">
      <div className="arena-shell screen-safe-bottom space-y-5">
        <ArenaHeader onBack={onBack} />
        <ArenaScoreboard
          game={game}
          quickPickQuestions={quickPickQuestions}
          quickPickSelections={quickPickSelections}
          savingQuickPickKey={savingQuickPickKey}
          quickPickMessage={quickPickMessage}
          onQuickPick={lockQuickPick}
        />
        <ArenaTabs activeTab={activeTab} onSelect={setActiveTab} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="space-y-4">
            {activeTab === "chat" && <ChatPanel />}
            {activeTab === "calls" && (
              <CallsPanel
                onChoose={() => {
                  setQuickPickMessage("Ride/Fade stays public. Quick Picks sit on the board above when you want something faster.");
                }}
              />
            )}
            {activeTab === "control-room" && <ControlRoomPanel />}
            {activeTab === "top-talkers" && <TopTalkersPanel />}
          </section>

          <aside className="space-y-4">
            {activeTab !== "control-room" && <ControlRoomPanel />}
            {activeTab !== "top-talkers" && <TopTalkersPanel />}
            <ArenaVibePanel />
          </aside>
        </div>
      </div>
    </main>
  );
}

function ArenaHeader({ onBack }: { onBack: () => void }) {
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
            12.8K <span className="text-gray-500">Online</span>
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
  savingQuickPickKey,
  quickPickMessage,
  onQuickPick,
}: {
  game: Game | null;
  quickPickQuestions: QuickPickQuestion[];
  quickPickSelections: Record<string, string>;
  savingQuickPickKey: string | null;
  quickPickMessage: string;
  onQuickPick: (question: QuickPickQuestion, selectedSide: string) => void;
}) {
  const awayTeam = game?.away_team ?? "LAL";
  const homeTeam = game?.home_team ?? "GSW";
  const awayScore = String(game?.away_score ?? 108);
  const homeScore = String(game?.home_score ?? 103);
  const period = game?.period ?? "4th QTR";
  const clock = game?.clock ?? "2:47";
  const watching = game?.watching_count ?? 12800;
  const status = game?.status ?? "live";

  return (
    <section className="arena-scoreboard overflow-hidden rounded-[1.75rem] border border-white/10 p-4 pt-5 shadow-[0_26px_80px_rgba(0,0,0,0.56),0_0_34px_rgba(168,85,247,0.08)] sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 text-center sm:gap-3">
        <ScoreTeam team={awayTeam} score={awayScore} label={`Team ${awayTeam}`} tone="ride" />

        <div className="pb-1">
          <span className="rounded-md border border-red-400/60 bg-red-500/10 px-2.5 py-1 text-xs font-black uppercase text-red-300">
            ▷ {status}
          </span>
          <p className="mt-3 text-xs font-black uppercase text-purple-300">{period}</p>
          <p className="scoreboard-number mt-1 text-4xl text-white">{clock}</p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300">
            <span className="h-2 w-2 rounded-full bg-lime-400" /> {formatCompact(watching)} Watching
          </p>
          <span className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/60 text-[10px] font-black text-gray-300">
            VS
          </span>
        </div>

        <ScoreTeam team={homeTeam} score={homeScore} label={`Team ${homeTeam}`} tone="fade" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase">
          <span className="text-lime-300">62% Riding {awayTeam}</span>
          <span className="text-purple-300">38% Fading {homeTeam}</span>
        </div>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/10">
          <div className="w-[62%] bg-gradient-to-r from-lime-400 to-lime-300" />
          <div className="w-3 bg-white/30" />
          <div className="flex-1 bg-gradient-to-r from-purple-700 to-purple-400" />
        </div>
      </div>

      <QuickPickPanel
        questions={quickPickQuestions}
        selections={quickPickSelections}
        savingQuestionKey={savingQuickPickKey}
        message={quickPickMessage}
        onPick={onQuickPick}
      />

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/50 p-3.5 sm:grid-cols-[0.8fr_1.25fr_0.85fr] sm:items-center">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400">Heat Level</p>
          <p className="mt-1 text-2xl font-black text-lime-300">🔥 3.6K</p>
          <p className="text-[10px] font-black uppercase text-red-300">Very Hot</p>
        </div>
        <div className="border-y border-white/10 py-3 text-center sm:border-x sm:border-y-0 sm:px-4 sm:py-0">
          <p className="text-[10px] font-black uppercase text-gray-400">Momentum</p>
          <Sparkline />
          <p className="mt-1 text-xs font-black uppercase text-lime-300">↑ LAL</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black uppercase text-gray-400">Upset Threat</p>
          <p className="scoreboard-number mt-1 text-4xl text-purple-300">68%</p>
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
  savingQuestionKey,
  message,
  onPick,
}: {
  questions: QuickPickQuestion[];
  selections: Record<string, string>;
  savingQuestionKey: string | null;
  message: string;
  onPick: (question: QuickPickQuestion, selectedSide: string) => void;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-white/10 bg-black/55 p-3.5 shadow-[0_0_30px_rgba(132,204,22,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Quick Picks</p>
          <p className="mt-1 text-xs font-bold text-gray-300">Low stakes · {formatRepSwing(QUICK_PICK_WIN, QUICK_PICK_LOSS)} REP</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-300">
          Fast lane
        </span>
      </div>

      <div className="mt-3 grid gap-3">
        {questions.map((question) => {
          const lockedSelection = selections[question.key];
          const isSaving = savingQuestionKey === question.key;

          return (
            <div key={question.key} className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-white">{question.questionText}</p>
                {lockedSelection && (
                  <span className="rounded-full border border-lime-300/45 bg-lime-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
                    Locked
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {question.options.map((option) => (
                  <QuickPickButton
                    key={option.value}
                    label={option.label}
                    tone={option.tone}
                    isLocked={lockedSelection === option.value}
                    disabled={Boolean(lockedSelection) || isSaving}
                    onClick={() => onPick(question, option.value)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px] font-bold text-gray-400">
        {message || "Quick Picks stay fast. Ride/Fade stays public. Locked Takes stay permanent."}
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
  awayTeam,
  homeTeam,
  awayScore,
  homeScore,
}: {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
}) {
  const trailingTeam = awayScore === homeScore ? awayTeam : awayScore < homeScore ? awayTeam : homeTeam;

  return [
    {
      key: "next-bucket",
      questionText: "Next bucket?",
      options: [
        { label: awayTeam, value: awayTeam, tone: "green" as const },
        { label: homeTeam, value: homeTeam, tone: "purple" as const },
      ],
    },
    {
      key: "ot-incoming",
      questionText: "OT incoming?",
      options: [
        { label: "Yes", value: "yes", tone: "purple" as const },
        { label: "No", value: "no", tone: "green" as const },
      ],
    },
    {
      key: "comeback-alive",
      questionText: `${trailingTeam} comeback alive?`,
      options: [
        { label: "Alive", value: "alive", tone: "green" as const },
        { label: "Cooked", value: "cooked", tone: "purple" as const },
      ],
    },
  ];
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
          LAL closing this. Warriors cooked.
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
      <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-lime-300 via-purple-500 to-black text-xs font-black text-white">
        {take.avatar}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">
          {take.handle} <span className="text-purple-300">◆</span>{" "}
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

function CallsPanel({ onChoose }: { onChoose: (side: Side) => void }) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      {liveCalls.map((call) => (
        <article key={call.handle} className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">{call.handle}</p>
            <span className="rounded-md border border-purple-300/35 bg-purple-500/10 px-2 py-1 text-[10px] font-black uppercase text-purple-200">
              {call.status}
            </span>
          </div>
          <p className="mt-3 text-lg font-black leading-tight text-gray-100">{call.text}</p>
          <div className="mt-4 flex items-center justify-between text-sm font-black">
            <span className="text-lime-300">👍 {call.rides}</span>
            <span className="text-purple-300">👎 {call.fades}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ArenaChoiceButton label="Ride" tone="ride" onClick={() => onChoose("ride")} />
            <ArenaChoiceButton label="Fade" tone="fade" onClick={() => onChoose("fade")} />
          </div>
        </article>
      ))}
    </section>
  );
}

function ControlRoomPanel() {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <PanelHeader title="Control Room" />
      <p className="mt-4 text-[10px] font-black uppercase text-gray-400">Crowd Sentiment</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div>
          <p className="scoreboard-number text-4xl text-lime-300">62%</p>
          <p className="text-[10px] font-black uppercase text-lime-300">Riding LAL</p>
        </div>
        <div className="relative h-16 w-16 rounded-full bg-[conic-gradient(#84cc16_0_62%,#a855f7_62%_100%)]">
          <div className="absolute inset-3 rounded-full bg-black" />
        </div>
        <div className="text-right">
          <p className="scoreboard-number text-4xl text-purple-300">38%</p>
          <p className="text-[10px] font-black uppercase text-purple-300">Fading GSW</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/10 py-4">
        <StatBlock label="Ride Surge" value="+18%" detail="Last 2 min" tone="ride" />
        <StatBlock label="Fade Surge" value="+9%" detail="Last 2 min" tone="fade" />
      </div>

      <div className="mt-4 space-y-3">
        <SignalRow icon="◉" label="Crowd Confidence" value="85%" note="Very high" tone="ride" />
        <SignalRow icon="🔥" label="Overcommitment" value="72%" note="LAL side" tone="ride" />
        <SignalRow icon="ϟ" label="Momentum Shift" value="LAL ↑" note="Strong" tone="ride" />
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
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-lime-300 via-purple-500 to-black text-[10px] font-black text-white">
              {talker.avatar}
            </span>
            <p className="truncate text-sm font-black text-white">{talker.handle}</p>
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
