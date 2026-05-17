"use client";

import { useMemo, useState } from "react";
import { RouteBottomNav } from "@/components/BottomNav";
import { getWorldCupKickoffIso, isWorldCupMatchLocked, type WorldCupMatch } from "@/data/worldCupSchedule";
import { saveCurrentUserMatchPick } from "@/lib/supabase/matchPicks";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";
import type { MatchPick } from "@/lib/supabase/types";

type MakeCallPageProps = {
  match: WorldCupMatch;
  initialPick: MatchPick | null;
};

export function MakeCallPage({ match, initialPick }: MakeCallPageProps) {
  const isGroupStage = match.stage === "Group Stage";
  const lockClosed = isWorldCupMatchLocked(match);
  const [selectedWinner, setSelectedWinner] = useState<string>(initialPick?.selected_winner ?? "");
  const [homeScore, setHomeScore] = useState<string>(String(initialPick?.home_score ?? 0));
  const [awayScore, setAwayScore] = useState<string>(String(initialPick?.away_score ?? 0));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const kickoffIso = getWorldCupKickoffIso(match);
  const kickoffLabel = useMemo(() => {
    if (!kickoffIso) {
      return `${match.date} · ${match.kickoffET}`;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(kickoffIso));
  }, [kickoffIso, match.date, match.kickoffET]);

  async function lockPick() {
    if (lockClosed) {
      setStatus("error");
      setMessage("This match is already locked.");
      return;
    }

    const parsedHome = Number.parseInt(homeScore, 10);
    const parsedAway = Number.parseInt(awayScore, 10);

    if (!selectedWinner) {
      setStatus("error");
      setMessage("Choose a winner or draw before locking.");
      return;
    }

    if (!Number.isFinite(parsedHome) || parsedHome < 0 || !Number.isFinite(parsedAway) || parsedAway < 0) {
      setStatus("error");
      setMessage("Enter valid score predictions.");
      return;
    }

    setStatus("saving");
    setMessage("");

    const { error } = await saveCurrentUserMatchPick({
      match,
      selectedWinner,
      homeScore: parsedHome,
      awayScore: parsedAway,
    });

    if (error) {
      setStatus("error");
      setMessage(getUserFacingErrorMessage(error, "Unable to save your pick right now."));
      return;
    }

    setStatus("saved");
    setMessage("Pick locked");
  }

  return (
    <main className="min-h-dvh bg-black px-4 py-6 pb-28 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-4 screen-safe-bottom">
        <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Match Pick</p>
          <h1 className="sports-display mt-2 text-3xl italic leading-none text-white sm:text-4xl">MAKE YOUR CALL</h1>
          <p className="mt-2 text-sm font-semibold text-gray-300">You can update this until kickoff.</p>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-200">
            {match.stage} {match.group !== "KO" ? `· Group ${match.group}` : ""}
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            {match.homeTeam} vs {match.awayTeam ?? "TBD"}
          </h2>
          <p className="mt-1 text-xs font-semibold text-gray-400">{match.city} · {match.venue}</p>
          <p className="mt-1 text-xs font-semibold text-gray-400">{kickoffLabel}</p>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Pick Winner</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {buildWinnerOptions(match.homeTeam, match.awayTeam ?? "TBD", isGroupStage).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedWinner(option.value)}
                disabled={lockClosed}
                className={`min-h-11 rounded-xl border px-3 text-xs font-black uppercase tracking-[0.1em] ${
                  selectedWinner === option.value
                    ? "border-lime-300/70 bg-lime-400/10 text-lime-200"
                    : "border-white/15 bg-white/[0.03] text-white"
                } disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Exact Score</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-gray-300">{match.homeTeam}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={homeScore}
                onChange={(event) => setHomeScore(event.target.value)}
                disabled={lockClosed}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm font-semibold text-white outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-gray-300">{match.awayTeam ?? "TBD"}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={awayScore}
                onChange={(event) => setAwayScore(event.target.value)}
                disabled={lockClosed}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm font-semibold text-white outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={lockPick}
            disabled={lockClosed || status === "saving"}
            className="mt-4 min-h-11 w-full rounded-xl border border-purple-300/55 bg-purple-500/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-purple-100 disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Lock Pick"}
          </button>
          {lockClosed ? <p className="mt-2 text-xs font-semibold text-lime-300">Locked before kickoff</p> : null}
          {message ? (
            <p className={`mt-2 text-xs font-semibold ${status === "error" ? "text-red-300" : "text-lime-300"}`}>{message}</p>
          ) : null}
        </section>
      </div>
      <RouteBottomNav activeView="schedule" />
    </main>
  );
}

function buildWinnerOptions(homeTeam: string, awayTeam: string, allowDraw: boolean) {
  const options: Array<{ value: string; label: string }> = [
    { value: homeTeam, label: homeTeam },
    { value: awayTeam, label: awayTeam },
  ];

  if (allowDraw) {
    options.push({ value: "Draw", label: "Draw" });
  }

  return options;
}
