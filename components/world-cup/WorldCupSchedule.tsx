"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWorldCupFixtureSourceUrls, getWorldCupMatchId, worldCupSchedule, type WorldCupGroup, type WorldCupMatch } from "@/data/worldCupSchedule";
import { SHOW_GAME_ROOM } from "@/lib/productConfig";
import {
  formatLocalKickoff,
  getKickoffMs,
  getLocalDateKey,
  getLocalDateLabel,
  WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE,
} from "@/lib/worldCup/localSchedule";
import type { ScheduleMatchState, ScheduleMatchStatus } from "@/lib/worldCup/scheduleStatus";

/**
 * Deterministic timezone for SSR + the first client render so server and client
 * markup match (avoids hydration errors). After mount we switch to the viewer's
 * actual browser timezone, which is the real source of truth for grouping/sorting.
 */

const groupFilters: Array<{ value: "ALL" | WorldCupGroup; label: string }> = [
  { value: "ALL", label: "All Groups" },
  { value: "A", label: "Group A" },
  { value: "B", label: "Group B" },
  { value: "C", label: "Group C" },
  { value: "D", label: "Group D" },
  { value: "E", label: "Group E" },
  { value: "F", label: "Group F" },
  { value: "G", label: "Group G" },
  { value: "H", label: "Group H" },
  { value: "I", label: "Group I" },
  { value: "J", label: "Group J" },
  { value: "K", label: "Group K" },
  { value: "L", label: "Group L" },
  { value: "KO", label: "Knockout Stage" },
];

type WorldCupScheduleProps = {
  limit?: number;
  showHeader?: boolean;
  showViewFullLink?: boolean;
  /** match.id -> live/derived state. Missing entries fall back to "upcoming". */
  matchStates?: Record<number, ScheduleMatchState>;
};

const FALLBACK_MATCH_STATE: ScheduleMatchState = { status: "upcoming", homeScore: null, awayScore: null };

export function WorldCupSchedule({
  limit,
  showHeader = true,
  showViewFullLink = false,
  matchStates = {},
}: WorldCupScheduleProps) {
  const sourceUrls = getWorldCupFixtureSourceUrls();
  const [selectedGroup, setSelectedGroup] = useState<"ALL" | WorldCupGroup>("ALL");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  // Source of truth for grouping/sorting. ET on the server + first paint, then
  // the viewer's real browser timezone after mount (keeps hydration stable).
  const [timeZone, setTimeZone] = useState(WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE);
  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved) {
      setTimeZone(resolved);
    }
  }, []);
  const collator = useMemo(() => new Intl.Collator("en", { sensitivity: "base" }), []);

  const cities = useMemo(
    () => ["All Cities", ...new Set(worldCupSchedule.map((match) => match.city))].sort((a, b) => (a === "All Cities" ? -1 : b === "All Cities" ? 1 : a.localeCompare(b))),
    [],
  );
  const teams = useMemo(
    () => {
      const teamNames = new Set(
        worldCupSchedule
          .flatMap((match) => [match.homeTeam, match.awayTeam].filter(Boolean) as string[])
          .filter(isCountryTeamName),
      );

      return ["All Teams", ...[...teamNames].sort((a, b) => collator.compare(a, b))];
    },
    [collator],
  );

  const filteredMatches = useMemo(() => {
    const matches = worldCupSchedule.filter((match) => {
      if (selectedGroup !== "ALL" && match.group !== selectedGroup) return false;
      if (selectedCity !== "All Cities" && match.city !== selectedCity) return false;
      if (selectedTeam !== "All Teams" && match.homeTeam !== selectedTeam && match.awayTeam !== selectedTeam) return false;
      return true;
    });

    return typeof limit === "number" ? matches.slice(0, limit) : matches;
  }, [limit, selectedCity, selectedGroup, selectedTeam]);

  // Group by the viewer's LOCAL calendar day and sort chronologically within
  // each day by local kickoff — never by FIFA matchday. Answers "what's on next
  // for me, in my timezone?".
  const groupedByDate = useMemo(() => {
    const byDate = new Map<string, { label: string; matches: WorldCupMatch[] }>();
    for (const match of filteredMatches) {
      const key = getLocalDateKey(match, timeZone);
      const bucket = byDate.get(key) ?? { label: getLocalDateLabel(match, timeZone), matches: [] };
      bucket.matches.push(match);
      byDate.set(key, bucket);
    }

    return [...byDate.entries()]
      .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0))
      .map(([key, bucket]) => ({
        key,
        label: bucket.label,
        matches: [...bucket.matches].sort((a, b) => getKickoffMs(a) - getKickoffMs(b)),
      }));
  }, [filteredMatches, timeZone]);

  const remainingCount = useMemo(
    () => filteredMatches.filter((match) => (matchStates[match.id] ?? FALLBACK_MATCH_STATE).status !== "final").length,
    [filteredMatches, matchStates],
  );

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[var(--surface-section)] p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.34)] sm:p-4">
      {showHeader ? (
        <div className="mb-3.5 sm:mb-4">
          <h1 className="sports-display text-3xl italic leading-none text-white sm:text-4xl">WORLD CUP 2026 SCHEDULE</h1>
          <p className="mt-1.5 text-sm font-semibold text-gray-300">
            Find a game, open its room, and make your call with friends and family.
          </p>
        </div>
      ) : null}

      <div className="sticky top-2 z-10 mb-3.5 grid gap-2 rounded-2xl border border-white/10 bg-[var(--surface-section)] p-2 backdrop-blur sm:mb-4 sm:grid-cols-3 sm:p-2.5">
        <FilterSelect label="Group" value={selectedGroup} onChange={setSelectedGroup} options={groupFilters} />
        <FilterSelect label="City" value={selectedCity} onChange={setSelectedCity} options={cities.map((city) => ({ value: city, label: city }))} />
        <FilterSelect label="Team" value={selectedTeam} onChange={setSelectedTeam} options={teams.map((team) => ({ value: team, label: team }))} />
      </div>

      <div className="mb-2.5 flex items-center justify-between sm:mb-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-lime-300">{remainingCount} Matches Remaining</p>
        {showViewFullLink ? (
          <Link href="/schedule" className="text-xs font-black uppercase tracking-[0.1em] text-purple-300 hover:text-purple-100">
            View Full Schedule
          </Link>
        ) : null}
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {groupedByDate.map(({ key, label, matches }) => (
          <article key={key} className="rounded-2xl border border-white/10 bg-[var(--surface-card)] p-2.5 sm:p-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-300">{label}</p>
            <div className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2">
              {matches.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  state={matchStates[match.id] ?? FALLBACK_MATCH_STATE}
                  kickoffLabel={formatLocalKickoff(match, timeZone)}
                />
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-3 text-[11px] font-semibold text-gray-500">
        Fixture data based on FIFA&apos;s official World Cup 2026 schedule. <a className="underline underline-offset-2" href={sourceUrls.page} target="_blank" rel="noopener noreferrer">Source</a>
      </p>
    </section>
  );
}

function isCountryTeamName(name: string) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "tbd") return false;
  if (normalized.includes("winner")) return false;
  if (normalized.includes("runner-up")) return false;
  if (normalized.includes("runner up")) return false;
  if (normalized.includes("group")) return false;
  if (/\d/.test(normalized)) return false;
  return true;
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-black/60 px-3 text-sm font-semibold text-white outline-none focus:border-lime-300/60 sm:min-h-11"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#090b13]">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getScheduleCta(match: WorldCupMatch, status: ScheduleMatchStatus) {
  const gameRoomHref = `/game/${getWorldCupMatchId(match)}`;
  const matchRoomHref = `/matches/${match.id}`;

  if (status === "final") {
    return { label: "View Match", href: matchRoomHref };
  }

  if (status === "live") {
    return { label: "Join Game Room", href: SHOW_GAME_ROOM ? matchRoomHref : gameRoomHref };
  }

  return { label: "Join Game Room", href: gameRoomHref };
}

function MatchRow({ match, state, kickoffLabel }: { match: WorldCupMatch; state: ScheduleMatchState; kickoffLabel: string }) {
  const isKnockout = match.group === "KO";
  const cta = getScheduleCta(match, state.status);
  const awayTeam = match.awayTeam ?? "TBD";
  const hasScore = state.homeScore !== null && state.awayScore !== null;
  const showFinalScore = state.status === "final" && hasScore;

  return (
    <div
      className={`grid gap-1.5 rounded-xl border p-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:p-3 ${
        isKnockout ? "border-purple-300/30 bg-purple-500/10" : "border-white/10 bg-black/50"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.1em] text-lime-300 sm:text-[13px]">{kickoffLabel}</p>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-black text-white sm:text-base">
          {showFinalScore ? `${match.homeTeam} ${state.homeScore}–${state.awayScore} ${awayTeam}` : `${match.homeTeam} vs ${awayTeam}`}
        </p>
        <p className="truncate text-xs font-semibold text-gray-400 sm:text-[13px]">
          {match.city} · {match.venue}
        </p>
      </div>
      <div className="flex items-center gap-1.5 sm:justify-end sm:gap-2">
        {state.status === "live" ? (
          <span className="rounded-md border border-red-400/50 bg-red-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-red-300 sm:px-2.5">
            Live
          </span>
        ) : null}
        {state.status === "final" ? (
          <span className="rounded-md border border-white/20 bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-gray-300 sm:px-2.5">
            Final
          </span>
        ) : null}
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] sm:px-2.5 ${
            isKnockout ? "border border-purple-300/45 bg-purple-500/15 text-purple-200" : "border border-lime-300/40 bg-lime-400/10 text-lime-200"
          }`}
        >
          {isKnockout ? match.stage : `Group ${match.group}`}
        </span>
        <Link
          href={cta.href}
          className="rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white hover:border-lime-300/40 hover:text-lime-200 sm:px-3"
        >
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
