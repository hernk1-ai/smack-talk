"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyRootingState, type RootingSide, type RootingState } from "@/lib/gameRoom/rooting";
import { fetchRootingState, submitRootingVote } from "@/lib/gameRoom/rootingApi";

type GameRoomRootingProps = {
  gameId: string;
  roomCode?: string | null;
  homeTeam: string;
  awayTeam: string;
};

export function GameRoomRooting({ gameId, roomCode = null, homeTeam, awayTeam }: GameRoomRootingProps) {
  const [state, setState] = useState<RootingState>(() => emptyRootingState());
  const [loading, setLoading] = useState(true);
  const [savingSide, setSavingSide] = useState<RootingSide | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);

    const nextState = await fetchRootingState(gameId, roomCode);
    setState(nextState);
    setLoading(false);
  }, [gameId, roomCode]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  async function handleRoot(side: RootingSide) {
    if (savingSide) {
      return;
    }

    setSavingSide(side);
    setError(null);

    const { state: nextState, error: voteError } = await submitRootingVote(gameId, roomCode, side);
    setSavingSide(null);

    if (voteError || !nextState) {
      setError(voteError ?? "Unable to save your vote.");
      return;
    }

    setState(nextState);
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <h2 className="text-center text-lg font-black text-white">Who are you rooting for?</h2>
      <p className="mt-1 text-center text-sm font-semibold text-gray-400">Tap thumbs up for your team. Switch anytime.</p>

      {error ? (
        <p className="mt-3 text-center text-xs font-semibold text-red-300">
          {error}{" "}
          <button type="button" onClick={() => void loadState()} className="underline">
            Retry
          </button>
        </p>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:gap-3">
        <RootingTeamCard
          team={homeTeam}
          count={state.homeCount}
          selected={state.choice === "home"}
          tone="home"
          disabled={loading || savingSide !== null}
          onRoot={() => void handleRoot("home")}
        />

        <div className="flex items-center justify-center px-1 pb-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/50 text-[10px] font-black text-gray-400">
            VS
          </span>
        </div>

        <RootingTeamCard
          team={awayTeam}
          count={state.awayCount}
          selected={state.choice === "away"}
          tone="away"
          disabled={loading || savingSide !== null}
          onRoot={() => void handleRoot("away")}
        />
      </div>
    </section>
  );
}

function RootingTeamCard({
  team,
  count,
  selected,
  tone,
  disabled,
  onRoot,
}: {
  team: string;
  count: number;
  selected: boolean;
  tone: "away" | "home";
  disabled: boolean;
  onRoot: () => void;
}) {
  const selectedClass =
    tone === "away"
      ? "border-lime-300/55 bg-lime-400/10 shadow-[0_0_24px_rgba(132,204,22,0.12)]"
      : "border-purple-300/55 bg-purple-500/10 shadow-[0_0_24px_rgba(168,85,247,0.12)]";
  const labelClass = tone === "away" ? "text-lime-300" : "text-purple-300";
  const buttonClass =
    tone === "away"
      ? "border-lime-300/45 bg-lime-400/10 text-lime-200 hover:bg-lime-400/20"
      : "border-purple-300/45 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20";

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-3 text-center transition sm:p-4 ${
        selected ? selectedClass : "border-white/10 bg-black/45"
      }`}
    >
      <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${labelClass}`}>{team} fans</p>
      <p className="sports-display mt-2 text-xl leading-none text-white sm:text-2xl">{team}</p>
      <button
        type="button"
        onClick={onRoot}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={selected ? `Rooting for ${team}` : `Tap to root for ${team}`}
        className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
      >
        <span aria-hidden="true">👍</span>
        <span>{count}</span>
      </button>
      <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.08em] ${selected ? labelClass : "text-gray-500"}`}>
        {selected ? "You're rooting" : `Tap to root for ${team}`}
      </p>
    </div>
  );
}
