"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWorldCupFixtureSourceUrls, getWorldCupMatchId, worldCupSchedule, type WorldCupGroup, type WorldCupMatch } from "@/data/worldCupSchedule";
import { SHOW_GAME_ROOM } from "@/lib/productConfig";
import {
  formatLocalKickoff,
  getKickoffMs,
  getLocalDateKey,
  getLocalDateKeyForInstant,
  getLocalDateLabel,
  getTodayLocalDateKey,
  WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE,
} from "@/lib/worldCup/localSchedule";
import {
  buildResolvedMatchContext,
  resolveMatch,
  type ResolvedMatch,
  type ResolvedMatchContext,
  type ResolvedMatchContextInput,
} from "@/lib/worldCup/resolvedMatch";
import { getCanonicalCurrentOrNextMatch } from "@/lib/worldCup/canonicalMatch";
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
  /** Single server timestamp to keep first render + hydration grouping aligned. */
  initialNowIso?: string;
  /** FIFA bracket + ESPN game rows for canonical match resolution. */
  matchContext?: ResolvedMatchContextInput;
};

const FALLBACK_MATCH_STATE: ScheduleMatchState = { status: "upcoming", homeScore: null, awayScore: null };

type DisplayMatch = {
  match: WorldCupMatch;
  state: ScheduleMatchState;
  kickoffLabel: string;
  kickoffMs: number;
  localDateKey: string;
  localDateLabel: string;
};

type MatchSection = {
  key: string;
  title: string;
  subtitle?: string;
  matches: DisplayMatch[];
  tone?: "default" | "live" | "results";
};

export function WorldCupSchedule({
  limit,
  showHeader = true,
  showViewFullLink = false,
  matchStates = {},
  initialNowIso,
  matchContext,
}: WorldCupScheduleProps) {
  const sourceUrls = getWorldCupFixtureSourceUrls();
  const [selectedGroup, setSelectedGroup] = useState<"ALL" | WorldCupGroup>("ALL");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [showEarlierResults, setShowEarlierResults] = useState(false);
  // Source of truth for grouping/sorting. ET on the server + first paint, then
  // the viewer's real browser timezone after mount (keeps hydration stable).
  const [timeZone, setTimeZone] = useState(WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE);
  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved) {
      const timeout = window.setTimeout(() => setTimeZone(resolved), 0);
      return () => window.clearTimeout(timeout);
    }
  }, []);
  const collator = useMemo(() => new Intl.Collator("en", { sensitivity: "base" }), []);

  const referenceNow = useMemo(() => new Date(initialNowIso ?? new Date().toISOString()), [initialNowIso]);
  const resolvedContext = useMemo(
    () =>
      buildResolvedMatchContext({
        knockoutResolution: matchContext?.knockoutResolution ?? { standings: [], bracket: [] },
        games: matchContext?.games ?? [],
        nowIso: referenceNow.toISOString(),
      }),
    [matchContext, referenceNow],
  );

  const cities = useMemo(
    () => ["All Cities", ...new Set(worldCupSchedule.map((match) => match.city))].sort((a, b) => (a === "All Cities" ? -1 : b === "All Cities" ? 1 : a.localeCompare(b))),
    [],
  );
  const teams = useMemo(
    () => {
      const teamNames = new Set(
        worldCupSchedule
          .flatMap((match) => {
            const resolved = resolveMatch(match, resolvedContext);
            return [resolved.home.name, resolved.away.name];
          })
          .filter(isCountryTeamName),
      );

      return ["All Teams", ...[...teamNames].sort((a, b) => collator.compare(a, b))];
    },
    [collator, resolvedContext],
  );
  const filteredMatches = useMemo(() => {
    const matches = worldCupSchedule.filter((match) => {
      if (selectedGroup !== "ALL" && match.group !== selectedGroup) return false;
      if (selectedCity !== "All Cities" && match.city !== selectedCity) return false;
      if (selectedTeam !== "All Teams") {
        const resolved = resolveMatch(match, resolvedContext);
        if (resolved.home.name !== selectedTeam && resolved.away.name !== selectedTeam) return false;
      }
      return true;
    });

    return typeof limit === "number" ? matches.slice(0, limit) : matches;
  }, [resolvedContext, limit, selectedCity, selectedGroup, selectedTeam]);

  const displayMatches = useMemo(
    () =>
      [...filteredMatches]
        .sort((a, b) => getKickoffMs(a) - getKickoffMs(b))
        .map((match) => ({
          match,
          state: matchStates[match.id] ?? FALLBACK_MATCH_STATE,
          kickoffLabel: formatLocalKickoff(match, timeZone),
          kickoffMs: getKickoffMs(match),
          localDateKey: getLocalDateKey(match, timeZone),
          localDateLabel: getLocalDateLabel(match, timeZone),
        })),
    [filteredMatches, matchStates, timeZone],
  );

  const todayKey = useMemo(() => getTodayLocalDateKey(timeZone, referenceNow), [referenceNow, timeZone]);
  const tomorrowKey = useMemo(
    () => getLocalDateKeyForInstant(new Date(referenceNow.getTime() + 24 * 60 * 60 * 1000).toISOString(), timeZone),
    [referenceNow, timeZone],
  );

  const liveMatches = useMemo(() => displayMatches.filter((entry) => entry.state.status === "live"), [displayMatches]);
  const awaitingMatches = useMemo(
    () => displayMatches.filter((entry) => entry.state.status === "awaiting_result"),
    [displayMatches],
  );
  const upcomingMatches = useMemo(() => displayMatches.filter((entry) => entry.state.status === "upcoming"), [displayMatches]);
  const completedMatches = useMemo(() => displayMatches.filter((entry) => entry.state.status === "final"), [displayMatches]);

  const todayUpcoming = useMemo(() => upcomingMatches.filter((entry) => entry.localDateKey === todayKey), [todayKey, upcomingMatches]);
  const todayAwaiting = useMemo(() => awaitingMatches.filter((entry) => entry.localDateKey === todayKey), [awaitingMatches, todayKey]);
  const tomorrowUpcoming = useMemo(() => upcomingMatches.filter((entry) => entry.localDateKey === tomorrowKey), [tomorrowKey, upcomingMatches]);
  const laterUpcoming = useMemo(
    () => upcomingMatches.filter((entry) => entry.localDateKey !== todayKey && entry.localDateKey !== tomorrowKey),
    [todayKey, tomorrowKey, upcomingMatches],
  );
  const completedToday = useMemo(() => completedMatches.filter((entry) => entry.localDateKey === todayKey), [completedMatches, todayKey]);
  const olderCompleted = useMemo(() => completedMatches.filter((entry) => entry.localDateKey < todayKey), [completedMatches, todayKey]);
  const allCompleted =
    displayMatches.length > 0 &&
    liveMatches.length === 0 &&
    upcomingMatches.length === 0 &&
    awaitingMatches.length === 0;

  const remainingCount = useMemo(
    () => displayMatches.filter((entry) => entry.state.status !== "final").length,
    [displayMatches],
  );

  const canonicalFocus = useMemo(() => {
    const states: Record<number, ScheduleMatchState> = {};
    for (const entry of displayMatches) {
      states[entry.match.id] = entry.state;
    }

    return getCanonicalCurrentOrNextMatch(filteredMatches, states, resolvedContext, referenceNow);
  }, [displayMatches, filteredMatches, resolvedContext, referenceNow]);

  const statusLiveMatch = useMemo(() => {
    if (canonicalFocus.mode !== "live") {
      return null;
    }

    return displayMatches.find((entry) => entry.match.id === canonicalFocus.match.id) ?? null;
  }, [canonicalFocus, displayMatches]);

  const nextMatch = useMemo(() => {
    if (canonicalFocus.mode !== "upcoming") {
      return null;
    }

    return displayMatches.find((entry) => entry.match.id === canonicalFocus.match.id) ?? null;
  }, [canonicalFocus, displayMatches]);

  const sectionList = useMemo(() => {
    if (allCompleted) {
      return groupMatchesIntoSections(completedMatches, {
        keyPrefix: "final",
        tone: "results",
        sortDirection: "desc",
      });
    }

    const sections: MatchSection[] = [];

    if (liveMatches.length > 0) {
      sections.push({
        key: "live-now",
        title: "Live Now",
        subtitle: liveMatches.length === 1 ? "Match in progress" : `${liveMatches.length} matches in progress`,
        matches: liveMatches,
        tone: "live",
      });
    }

    if (todayAwaiting.length > 0) {
      sections.push({
        key: "awaiting-today",
        title: "Awaiting Result",
        subtitle: todayAwaiting.length === 1 ? "Final score pending sync" : `${todayAwaiting.length} matches awaiting final score`,
        matches: todayAwaiting,
        tone: "live",
      });
    }

    if (todayUpcoming.length > 0) {
      sections.push({
        key: "today",
        title: "Today",
        subtitle: todayUpcoming[0]?.localDateLabel,
        matches: todayUpcoming,
      });
    }

    if (tomorrowUpcoming.length > 0) {
      sections.push({
        key: "tomorrow",
        title: "Tomorrow",
        subtitle: tomorrowUpcoming[0]?.localDateLabel,
        matches: tomorrowUpcoming,
      });
    }

    sections.push(
      ...groupMatchesIntoSections(laterUpcoming, {
        keyPrefix: "upcoming",
      }),
    );

    if (completedToday.length > 0) {
      sections.push({
        key: "today-results",
        title: todayUpcoming.length > 0 ? "Earlier Today" : "Today Results",
        subtitle: completedToday[0]?.localDateLabel,
        matches: completedToday,
        tone: "results",
      });
    }

    return sections;
  }, [allCompleted, completedMatches, completedToday, laterUpcoming, liveMatches, todayAwaiting, todayUpcoming, tomorrowUpcoming]);

  const earlierResultSections = useMemo(
    () =>
      groupMatchesIntoSections(olderCompleted, {
        keyPrefix: "earlier-results",
        tone: "results",
        sortDirection: "desc",
      }),
    [olderCompleted],
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

      <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3">
        <StatusSummary
          allCompleted={allCompleted}
          liveMatch={statusLiveMatch}
          nextMatch={nextMatch}
          remainingCount={remainingCount}
          resolvedContext={resolvedContext}
        />
        {showViewFullLink ? (
          <Link href="/schedule" className="text-xs font-black uppercase tracking-[0.1em] text-purple-300 hover:text-purple-100">
            View Full Schedule
          </Link>
        ) : null}
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {displayMatches.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-white/15 bg-[var(--surface-card)] p-4 text-center">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-lime-300">No matches found</p>
            <p className="mt-1 text-sm font-semibold text-gray-300">Try a different group, city, or team filter.</p>
          </article>
        ) : (
          <>
            {sectionList.map((section) => (
              <MatchSectionCard key={section.key} section={section} resolvedContext={resolvedContext} />
            ))}
            {!allCompleted && olderCompleted.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[var(--surface-card)] p-2.5 sm:p-3">
                <button
                  type="button"
                  onClick={() => setShowEarlierResults((current) => !current)}
                  aria-expanded={showEarlierResults}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left transition hover:border-lime-300/30"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-200">Earlier Results ({olderCompleted.length})</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-500">Completed matches from previous days</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-lime-300">
                    {showEarlierResults ? "Hide" : "Show"}
                  </span>
                </button>
                {showEarlierResults ? (
                  <div className="mt-2 space-y-2.5 sm:space-y-3">
                    {earlierResultSections.map((section) => (
                      <MatchSectionCard key={section.key} section={section} resolvedContext={resolvedContext} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
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

  if (status === "awaiting_result") {
    return { label: "View Match", href: gameRoomHref };
  }

  if (status === "live") {
    return { label: "Join Live", href: SHOW_GAME_ROOM ? matchRoomHref : gameRoomHref };
  }

  return { label: "Join Game Room", href: gameRoomHref };
}

function StatusSummary({
  allCompleted,
  liveMatch,
  nextMatch,
  remainingCount,
  resolvedContext,
}: {
  allCompleted: boolean;
  liveMatch: DisplayMatch | null;
  nextMatch: DisplayMatch | null;
  remainingCount: number;
  resolvedContext: ResolvedMatchContext;
}) {
  if (allCompleted) {
    return (
      <div className="flex-1 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(163,230,53,0.16),rgba(255,255,255,0.03))] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Tournament Complete</p>
        <p className="mt-1 text-lg font-black text-white">All final results are in.</p>
        <p className="mt-1 text-xs font-semibold text-gray-300">Browse the finished matches below.</p>
      </div>
    );
  }

  if (liveMatch) {
    const cta = getScheduleCta(liveMatch.match, liveMatch.state.status);
    const matchup = resolveMatch(liveMatch.match, resolvedContext);

    return (
      <div className="flex-1 rounded-2xl border border-lime-300/30 bg-[linear-gradient(135deg,rgba(163,230,53,0.16),rgba(255,255,255,0.03))] p-3 shadow-[0_0_30px_rgba(163,230,53,0.12)]">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Live Now</p>
        <p className="mt-1 text-lg font-black text-white">
          {matchup.title}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Link
            href={cta.href}
            className="rounded-md border border-lime-300/35 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-lime-200 hover:border-lime-200/50"
          >
            Join the room
          </Link>
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-200">{remainingCount} matches remaining</p>
        </div>
      </div>
    );
  }

  if (nextMatch) {
    const matchup = resolveMatch(nextMatch.match, resolvedContext);

    return (
      <div className="flex-1 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(163,230,53,0.12),rgba(255,255,255,0.03))] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Next Match</p>
        <p className="mt-1 text-lg font-black text-white">
          {matchup.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-300">{nextMatch.kickoffLabel}</p>
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-200">{remainingCount} matches remaining</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(163,230,53,0.12),rgba(255,255,255,0.03))] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Schedule Status</p>
      <p className="mt-1 text-lg font-black text-white">No live or upcoming matches in this view.</p>
      <p className="mt-1 text-xs font-semibold text-gray-300">Adjust the filters to explore more fixtures.</p>
    </div>
  );
}

function MatchSectionCard({
  section,
  resolvedContext,
}: {
  section: MatchSection;
  resolvedContext: ResolvedMatchContext;
}) {
  const headerToneClass =
    section.tone === "live" ? "text-lime-300" : section.tone === "results" ? "text-gray-300" : "text-gray-200";

  return (
    <article className="rounded-2xl border border-white/10 bg-[var(--surface-card)] p-2.5 sm:p-3">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-black uppercase tracking-[0.12em] ${headerToneClass}`}>{section.title}</p>
        {section.subtitle ? <p className="text-[11px] font-semibold text-gray-500">{section.subtitle}</p> : null}
      </div>
      <div className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2">
        {section.matches.map((entry) => (
          <MatchRow
            key={entry.match.id}
            match={entry.match}
            state={entry.state}
            kickoffLabel={entry.kickoffLabel}
            resolvedContext={resolvedContext}
          />
        ))}
      </div>
    </article>
  );
}

function MatchRow({
  match,
  state,
  kickoffLabel,
  resolvedContext,
}: {
  match: WorldCupMatch;
  state: ScheduleMatchState;
  kickoffLabel: string;
  resolvedContext: ResolvedMatchContext;
}) {
  const isKnockout = match.group === "KO";
  const cta = getScheduleCta(match, state.status);
  const matchup = resolveMatch(match, resolvedContext);
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
          {showFinalScore
            ? `${matchup.home.name} ${state.homeScore}–${state.awayScore} ${matchup.away.name}`
            : matchup.title}
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
        {state.status === "awaiting_result" ? (
          <span className="rounded-md border border-amber-300/50 bg-amber-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-amber-200 sm:px-2.5">
            Awaiting
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

function groupMatchesIntoSections(
  matches: DisplayMatch[],
  options: { keyPrefix: string; tone?: MatchSection["tone"]; sortDirection?: "asc" | "desc" },
): MatchSection[] {
  const grouped = new Map<string, { label: string; matches: DisplayMatch[] }>();

  for (const entry of matches) {
    const bucket = grouped.get(entry.localDateKey) ?? { label: entry.localDateLabel, matches: [] };
    bucket.matches.push(entry);
    grouped.set(entry.localDateKey, bucket);
  }

  return [...grouped.entries()]
    .sort(([keyA], [keyB]) => {
      if (keyA === keyB) return 0;
      const direction = options.sortDirection === "desc" ? -1 : 1;
      return keyA < keyB ? -1 * direction : 1 * direction;
    })
    .map(([key, bucket]) => ({
      key: `${options.keyPrefix}-${key}`,
      title: bucket.label,
      matches: bucket.matches.sort((a, b) => a.kickoffMs - b.kickoffMs),
      tone: options.tone,
    }));
}
