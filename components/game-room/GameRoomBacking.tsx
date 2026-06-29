"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getWorldCupKickoffIso, type WorldCupMatch } from "@/data/worldCupSchedule";
import { formatBackingJoinMinute } from "@/lib/gameRoom/backingMinute";
import { type RootingSide } from "@/lib/gameRoom/rooting";
import { fetchRootingState, submitRootingVote } from "@/lib/gameRoom/rootingApi";
import { getCurrentUserMatchPick, lockCurrentUserWinnerPick } from "@/lib/supabase/matchPicks";
import type { Game, MatchPick } from "@/lib/supabase/types";
import { scheduleStatusFromFeed } from "@/lib/worldCup/matchSelection";

type RoomStatus = "scheduled" | "live" | "final" | "awaiting";

type GameRoomBackingProps = {
  gameId: string;
  roomCode?: string | null;
  homeTeam: string;
  awayTeam: string;
  worldCupMatch: WorldCupMatch;
  game: Game | null;
  now: Date | null;
  hasSession: boolean;
  onRequireParticipation: (action: () => Promise<void>) => void | Promise<void>;
};

function resolveStatus(match: WorldCupMatch, game: Game | null, now: Date | null): RoomStatus {
  const startsAt = game?.starts_at ?? getWorldCupKickoffIso(match);

  if (!now || !startsAt) {
    if (game?.status === "final") {
      return "final";
    }
    if (game?.status === "live") {
      return "live";
    }
    return "scheduled";
  }

  const resolved = scheduleStatusFromFeed(game?.status, startsAt, now, game);
  if (resolved === "awaiting_result") {
    return "awaiting";
  }

  return resolved === "upcoming" ? "scheduled" : resolved;
}

function sideToTeam(side: RootingSide, homeTeam: string, awayTeam: string) {
  return side === "home" ? homeTeam : awayTeam;
}

function resolveFinalOutcome(pick: MatchPick | null, game: Game | null): "correct" | "incorrect" | "draw" | null {
  if (!pick?.winner_locked_at || !pick.selected_winner || !game) {
    return null;
  }

  const home = game.home_score ?? 0;
  const away = game.away_score ?? 0;
  if (home === away) {
    return "draw";
  }

  const winningTeam = home > away ? game.home_team : game.away_team;
  return pick.selected_winner === winningTeam ? "correct" : "incorrect";
}

export function GameRoomBacking({
  gameId,
  roomCode = null,
  homeTeam,
  awayTeam,
  worldCupMatch,
  game,
  now,
  hasSession,
  onRequireParticipation,
}: GameRoomBackingProps) {
  const [rooting, setRooting] = useState(() => ({
    homeCount: 0,
    awayCount: 0,
    choice: null as RootingSide | null,
    choiceAt: null as string | null,
  }));
  const [pick, setPick] = useState<MatchPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSide, setSavingSide] = useState<RootingSide | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = useMemo(() => resolveStatus(worldCupMatch, game, now), [worldCupMatch, game, now]);
  const kickoffIso = useMemo(() => getWorldCupKickoffIso(worldCupMatch), [worldCupMatch]);
  const totalFans = rooting.homeCount + rooting.awayCount;
  const homePct = totalFans > 0 ? Math.round((rooting.homeCount / totalFans) * 100) : 50;
  const awayPct = totalFans > 0 ? 100 - homePct : 50;

  const hasTournamentPick = Boolean(pick?.winner_locked_at);
  const selectedTeam =
    rooting.choice !== null ? sideToTeam(rooting.choice, homeTeam, awayTeam) : pick?.selected_winner ?? null;
  const participationLabel = hasTournamentPick ? "Pick" : rooting.choice ? "Backing" : null;
  const finalOutcome = resolveFinalOutcome(pick, game);

  const loadState = useCallback(async () => {
    const [nextRooting, pickResult] = await Promise.all([
      fetchRootingState(gameId, roomCode),
      hasSession ? getCurrentUserMatchPick(worldCupMatch) : Promise.resolve({ pick: null, error: null }),
    ]);

    setRooting(nextRooting);
    setPick(pickResult.pick ?? null);
    setLoading(false);
  }, [gameId, roomCode, worldCupMatch, hasSession]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchRootingState(gameId, roomCode).then(setRooting);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [gameId, roomCode]);

  async function handleBack(side: RootingSide) {
    if (savingSide) {
      return;
    }

    setSavingSide(side);
    setError(null);

    const team = sideToTeam(side, homeTeam, awayTeam);
    const { state: nextRooting, error: voteError } = await submitRootingVote(gameId, roomCode, side);

    if (voteError || !nextRooting) {
      setSavingSide(null);
      setError(voteError ?? "Unable to save your backing.");
      return;
    }

    setRooting(nextRooting);

    if (status === "scheduled" && hasSession) {
      await onRequireParticipation(async () => {
        const { pick: nextPick, error: pickError } = await lockCurrentUserWinnerPick({
          match: worldCupMatch,
          selectedWinner: team,
        });

        if (pickError && !pickError.message.includes("already locked")) {
          setError(pickError.message);
        } else if (nextPick) {
          setPick(nextPick);
        }
      });
    }

    setSavingSide(null);
  }

  const backingMinute =
    rooting.choiceAt && kickoffIso && status !== "scheduled" && !hasTournamentPick
      ? formatBackingJoinMinute(kickoffIso, rooting.choiceAt)
      : null;

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div className="text-center">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Who are you backing?</h2>
        <p className="mt-1 text-sm font-semibold text-gray-400">Pick a side and join the room.</p>
      </div>

      {totalFans > 0 ? (
        <div className="space-y-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-black/50">
            <div className="bg-purple-400/80 transition-all duration-500" style={{ width: `${homePct}%` }} />
            <div className="bg-lime-400/80 transition-all duration-500" style={{ width: `${awayPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
            <span className="text-purple-300">{homeTeam} — {homePct}%</span>
            <span className="text-lime-300">{awayTeam} — {awayPct}%</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-center text-xs font-semibold text-red-300">
          {error}{" "}
          <button type="button" onClick={() => void loadState()} className="underline">
            Retry
          </button>
        </p>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 sm:gap-3">
        <BackingTeamCard
          team={homeTeam}
          fanCount={rooting.homeCount}
          pct={homePct}
          selected={rooting.choice === "home"}
          tone="home"
          disabled={loading || savingSide !== null}
          onSelect={() => void handleBack("home")}
        />

        <div className="flex items-center justify-center px-1 pb-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/50 text-[10px] font-black text-gray-400">
            VS
          </span>
        </div>

        <BackingTeamCard
          team={awayTeam}
          fanCount={rooting.awayCount}
          pct={awayPct}
          selected={rooting.choice === "away"}
          tone="away"
          disabled={loading || savingSide !== null}
          onSelect={() => void handleBack("away")}
        />
      </div>

      {selectedTeam ? (
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-center">
          {participationLabel === "Pick" ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">Pick</p>
              <p className="mt-1 text-sm font-black text-white">You picked {selectedTeam}</p>
              {status === "final" && finalOutcome === "correct" ? (
                <p className="mt-2 text-sm font-black text-lime-200">✓ You called it!</p>
              ) : status === "final" && finalOutcome === "incorrect" ? (
                <p className="mt-2 text-sm font-black text-gray-300">✗ Not this time.</p>
              ) : status === "final" && finalOutcome === "draw" ? (
                <p className="mt-2 text-sm font-black text-gray-300">Match drawn.</p>
              ) : status !== "final" ? (
                <p className="mt-1 text-xs font-semibold text-gray-400">Counts toward your tournament record.</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-purple-300">Backing</p>
              <p className="mt-1 text-sm font-black text-white">
                You joined {selectedTeam}
                {backingMinute ? ` in ${backingMinute}` : ""}
              </p>
              <p className="mt-1 text-xs font-semibold text-gray-400">Showing your support — not counted in tournament record.</p>
            </>
          )}
        </div>
      ) : (
        <p className="text-center text-sm font-semibold text-gray-400">
          {loading ? "Loading fan counts…" : "Tap a team to join the room."}
        </p>
      )}
    </section>
  );
}

function BackingTeamCard({
  team,
  fanCount,
  pct,
  selected,
  tone,
  disabled,
  onSelect,
}: {
  team: string;
  fanCount: number;
  pct: number;
  selected: boolean;
  tone: "away" | "home";
  disabled: boolean;
  onSelect: () => void;
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
      <p className={`sports-display text-lg leading-none text-white sm:text-xl`}>{team}</p>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={selected ? `Backing ${team}` : `Back ${team}`}
        className={`mt-3 inline-flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
      >
        <span className="text-lg leading-none" aria-hidden="true">
          👍
        </span>
        <span className="text-sm font-black">
          {fanCount} {fanCount === 1 ? "fan" : "fans"}
        </span>
        {fanCount > 0 ? (
          <span className="text-[10px] font-black uppercase tracking-[0.08em] opacity-80">{pct}%</span>
        ) : null}
      </button>
      <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.08em] ${selected ? labelClass : "text-gray-500"}`}>
        {selected ? "You're backing" : "Tap to back"}
      </p>
    </div>
  );
}
