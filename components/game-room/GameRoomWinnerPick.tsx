"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { type WorldCupMatch } from "@/data/worldCupSchedule";
import { getCurrentUserMatchPick, lockCurrentUserWinnerPick } from "@/lib/supabase/matchPicks";
import type { Game, MatchPick } from "@/lib/supabase/types";
import { getWorldCupMatchStatus } from "@/lib/worldCupMatchStatus";

type RoomStatus = "scheduled" | "live" | "final";

type GameRoomWinnerPickProps = {
  worldCupMatch: WorldCupMatch;
  game: Game | null;
  now: Date;
  /** Wraps the save so a viewer joins (guest/auth) before their pick is saved. */
  onRequireParticipation: (action: () => Promise<void>) => void | Promise<void>;
};

function resolveStatus(match: WorldCupMatch, game: Game | null, now: Date): RoomStatus {
  const lifecycle = getWorldCupMatchStatus(match, now);
  const scheduleStatus: RoomStatus =
    lifecycle === "finished" ? "final" : lifecycle === "live" ? "live" : "scheduled";

  if (game?.status && game.status !== "scheduled") {
    return game.status === "final" ? "final" : game.status === "live" ? "live" : scheduleStatus;
  }

  return scheduleStatus;
}

type FinalOutcome = "correct" | "incorrect" | "draw";

function resolveFinalOutcome(pick: MatchPick | null, game: Game | null): FinalOutcome | null {
  if (!pick?.selected_winner || !game) {
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

export function GameRoomWinnerPick({ worldCupMatch, game, now, onRequireParticipation }: GameRoomWinnerPickProps) {
  const [pick, setPick] = useState<MatchPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = useMemo(() => resolveStatus(worldCupMatch, game, now), [worldCupMatch, game, now]);

  const homeTeam = game?.home_team ?? worldCupMatch.homeTeam;
  const awayTeam = game?.away_team ?? worldCupMatch.awayTeam ?? "TBD";
  const teams = useMemo(() => [homeTeam, awayTeam].filter((team) => team && team !== "TBD"), [homeTeam, awayTeam]);

  const loadPick = useCallback(async () => {
    const { pick: nextPick } = await getCurrentUserMatchPick(worldCupMatch);
    setPick(nextPick ?? null);
    setLoading(false);
  }, [worldCupMatch]);

  useEffect(() => {
    void loadPick();
  }, [loadPick]);

  const handlePick = (team: string) => {
    setError(null);
    void onRequireParticipation(async () => {
      setSaving(team);
      const { pick: nextPick, error: saveError } = await lockCurrentUserWinnerPick({
        match: worldCupMatch,
        selectedWinner: team,
      });
      setSaving(null);

      if (saveError) {
        setError(saveError.message);
        return;
      }

      if (nextPick) {
        setPick(nextPick);
      } else {
        await loadPick();
      }
    });
  };

  const finalOutcome = resolveFinalOutcome(pick, game);
  const hasPick = Boolean(pick?.selected_winner);
  const canPick = status === "scheduled" && !hasPick && teams.length === 2;

  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">
          {status === "final" ? "Your Winner Pick" : "Pick Your Winner"}
        </p>
        {hasPick ? (
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
            Pick saved
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm font-semibold text-gray-400">Loading your pick…</p>
      ) : canPick ? (
        <>
          <p className="text-sm font-semibold text-gray-300">
            Who&apos;s winning? Pick a team before kickoff and see if you called it.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {teams.map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => handlePick(team)}
                disabled={Boolean(saving)}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-lime-300/40 bg-lime-400/10 px-3 text-sm font-black text-lime-100 transition hover:bg-lime-400/20 disabled:opacity-60"
              >
                {saving === team ? "Saving…" : team}
              </button>
            ))}
          </div>
        </>
      ) : hasPick ? (
        <div className="space-y-2">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Your pick</p>
            <p className="mt-1 text-lg font-black text-white">{pick?.selected_winner}</p>
          </div>
          {finalOutcome === "correct" ? (
            <p className="rounded-xl border border-lime-300/40 bg-lime-400/10 px-3 py-2 text-sm font-black text-lime-200">
              ✓ You called it!
            </p>
          ) : finalOutcome === "incorrect" ? (
            <p className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-black text-gray-300">
              ✗ Not this time — better luck next match.
            </p>
          ) : finalOutcome === "draw" ? (
            <p className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-black text-gray-300">
              Match drawn — no winner this time.
            </p>
          ) : status === "live" ? (
            <p className="text-sm font-semibold text-gray-400">Match is live. Jump into the chat below!</p>
          ) : (
            <p className="text-sm font-semibold text-gray-400">We&apos;ll show if you called it after the final whistle.</p>
          )}
        </div>
      ) : (
        <p className="text-sm font-semibold text-gray-400">
          {status === "final"
            ? "No winner pick was saved for this match."
            : teams.length < 2
              ? "Teams will be confirmed soon — check back to pick your winner."
              : "Picks are closed for this match."}
        </p>
      )}

      {error ? <p className="text-xs font-semibold text-red-300">{error}</p> : null}
    </section>
  );
}
