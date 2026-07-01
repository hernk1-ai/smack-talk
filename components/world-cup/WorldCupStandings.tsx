"use client";

import { useMemo, useState } from "react";

import { worldCupGroupOrder } from "@/data/worldCupGroups";
import { FIFA_SCORES_FIXTURES_URL, FIFA_STANDINGS_URL, type KnockoutBracketMatch, type KnockoutBracketRound } from "@/lib/sports/fifaWorldCupStandingsSync";
import { getLocalDateKeyForInstant } from "@/lib/worldCup/localSchedule";
import { formatStandingsForm, type StandingsPageData, type WorldCupStandingRow } from "@/lib/worldCup/standingsTypes";

type WorldCupStandingsProps = StandingsPageData;

type StandingsTab = "groups" | "third" | "knockout";

const TIME_ZONE = "America/New_York";

const TABLE_HEADERS = ["P", "W", "D", "L", "GF", "GA", "GD", "Pts", "Form"] as const;

export function WorldCupStandings({ groups, thirdPlace, knockoutBracket, lastUpdated, isEmpty }: WorldCupStandingsProps) {
  const [activeTab, setActiveTab] = useState<StandingsTab>("groups");
  const flagLookup = useMemo(() => buildFlagLookup(groups, thirdPlace), [groups, thirdPlace]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">World Cup Standings</h1>
        <p className="text-sm text-gray-400">Group tables, third-place rankings, and knockout fixtures from FIFA.</p>
        {lastUpdated ? (
          <p className="text-xs text-gray-500">
            Last updated {new Date(lastUpdated).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        ) : null}
      </header>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center">
          <p className="text-sm text-gray-300">Standings are temporarily unavailable.</p>
          <p className="mt-2 text-xs text-gray-500">
            Check{" "}
            <a href={FIFA_STANDINGS_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              FIFA standings
            </a>{" "}
            for the latest tables.
          </p>
        </div>
      ) : (
        <>
          <StandingsTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "groups" ? (
            <section className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-sm text-gray-400">Top two in each group advance to the Round of 32.</p>
                <a
                  href={FIFA_STANDINGS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-gray-400 underline underline-offset-2 hover:text-white"
                >
                  FIFA standings
                </a>
              </div>
              {worldCupGroupOrder.map((groupName) => (
                <GroupStandingsBlock key={groupName} groupName={groupName} rows={groups[groupName] ?? []} />
              ))}
            </section>
          ) : null}

          {activeTab === "third" ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">Ranking of third-placed teams</h2>
                  <p className="mt-1 text-sm text-gray-400">Best eight third-place teams advance to the Round of 32.</p>
                </div>
                <a
                  href={FIFA_STANDINGS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-gray-400 underline underline-offset-2 hover:text-white"
                >
                  FIFA standings
                </a>
              </div>
              <StandingsTable rows={thirdPlace} showQualification={false} highlightQualifiedThirdPlace useSortedRank />
            </section>
          ) : null}

          {activeTab === "knockout" ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-bold text-white">Knockout stage</h2>
                <a
                  href={FIFA_SCORES_FIXTURES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-gray-400 underline underline-offset-2 hover:text-white"
                >
                  FIFA scores &amp; fixtures
                </a>
              </div>
              <KnockoutFixtureList rounds={knockoutBracket} flagLookup={flagLookup} />
            </section>
          ) : null}

          <StandingsLegend />
        </>
      )}
    </div>
  );
}

function StandingsTabs({ activeTab, onChange }: { activeTab: StandingsTab; onChange: (tab: StandingsTab) => void }) {
  const tabs: Array<{ id: StandingsTab; label: string }> = [
    { id: "groups", label: "Groups" },
    { id: "third", label: "Third place" },
    { id: "knockout", label: "Knockout" },
  ];

  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition sm:text-sm ${
              isActive ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function GroupStandingsBlock({ groupName, rows }: { groupName: string; rows: WorldCupStandingRow[] }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-base font-bold text-white sm:text-lg">{groupName}</h2>
      </div>
      <StandingsTable rows={rows} showQualification />
    </article>
  );
}

function isFifaQualified(status: string | null | undefined) {
  return typeof status === "string" && status.toLowerCase().includes("qualified");
}

function StandingsTable({
  rows,
  showQualification,
  highlightQualifiedThirdPlace = false,
  useSortedRank = false,
}: {
  rows: WorldCupStandingRow[];
  showQualification: boolean;
  highlightQualifiedThirdPlace?: boolean;
  useSortedRank?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-6 text-sm text-gray-500">No standings data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-gray-500 sm:text-[11px]">
            <th className="w-8 px-3 py-2.5 font-semibold">#</th>
            <th className="min-w-[9rem] px-3 py-2.5 font-semibold sm:min-w-[11rem]">Team</th>
            {TABLE_HEADERS.map((header) => (
              <th key={header} className="px-2 py-2.5 text-center font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isAdvancing = showQualification && row.rank <= 2;
            const isThirdPlaceAdvancing = highlightQualifiedThirdPlace && isFifaQualified(row.status);
            const isHighlighted = isAdvancing || isThirdPlaceAdvancing;
            const displayRank = useSortedRank ? index + 1 : row.rank;
            const formLetters = Array.isArray(row.form)
              ? row.form.filter((entry): entry is string => typeof entry === "string")
              : [];

            return (
              <tr
                key={`${row.group_name}-${row.team_code}`}
                className={`border-t border-white/5 ${isHighlighted ? "bg-emerald-500/[0.06]" : ""}`}
              >
                <td className="relative px-3 py-3 text-center font-semibold text-gray-300">
                  {isHighlighted ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-400" aria-hidden /> : null}
                  {displayRank}
                </td>
                <td className="px-3 py-3">
                  <TeamCell row={row} showGroup={useSortedRank} />
                </td>
                <td className="px-2 py-3 text-center text-gray-300">{row.played}</td>
                <td className="px-2 py-3 text-center text-gray-300">{row.wins}</td>
                <td className="px-2 py-3 text-center text-gray-300">{row.draws}</td>
                <td className="px-2 py-3 text-center text-gray-300">{row.losses}</td>
                <td className="px-2 py-3 text-center text-gray-300">{row.goals_for}</td>
                <td className="px-2 py-3 text-center text-gray-300">{row.goals_against}</td>
                <td className="px-2 py-3 text-center text-gray-300">
                  {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                </td>
                <td className="px-2 py-3 text-center font-bold text-white">{row.points}</td>
                <td className="px-2 py-3">
                  <div className="flex justify-center gap-0.5">
                    {formLetters.length > 0 ? (
                      formLetters.map((entry, index) => <FormBadge key={`${row.team_code}-${index}`} result={entry} />)
                    ) : (
                      <span className="text-gray-500">{formatStandingsForm(row.form)}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamCell({ row, showGroup = false }: { row: WorldCupStandingRow; showGroup?: boolean }) {
  return (
    <div className="flex min-w-[8.5rem] items-center gap-2.5">
      <TeamFlag flagUrl={row.flag_url} code={row.team_code} size="md" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{row.team_name}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[11px]">
          {showGroup ? `${row.group_name} · ${row.team_code}` : row.team_code}
        </p>
      </div>
    </div>
  );
}

function FormBadge({ result }: { result: string }) {
  const tone =
    result === "W"
      ? "bg-emerald-500 text-white"
      : result === "D"
        ? "bg-white/20 text-gray-200"
        : result === "L"
          ? "bg-rose-500 text-white"
          : "bg-white/10 text-gray-500";

  return (
    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-black ${tone}`}>
      {result}
    </span>
  );
}

function KnockoutFixtureList({
  rounds,
  flagLookup,
}: {
  rounds: KnockoutBracketRound[];
  flagLookup: FlagLookup;
}) {
  const sections = useMemo(() => groupKnockoutMatchesByDate(rounds), [rounds]);

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center text-sm text-gray-400">
        Knockout fixtures will appear once matchups are confirmed.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.key} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
            <h3 className="text-sm font-semibold text-white sm:text-base">{section.label}</h3>
          </div>
          <div className="divide-y divide-white/8">
            {section.matches.map((match) => (
              <KnockoutMatchRow key={match.id} match={match} flagLookup={flagLookup} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function KnockoutMatchRow({ match, flagLookup }: { match: KnockoutBracketMatch; flagLookup: FlagLookup }) {
  const isFinal =
    match.status === "final" || (match.homeScore != null && match.awayScore != null && match.status !== "upcoming");
  const kickoffTime = formatKnockoutKickoff(match.date);
  const homeFlag = match.homeFlagUrl ?? resolveFlag(match.homeCode, match.homeTeam, flagLookup);
  const awayFlag = match.awayFlagUrl ?? resolveFlag(match.awayCode, match.awayTeam, flagLookup);
  const venueLine = [match.round, match.venue && match.city ? `${match.venue} (${match.city})` : match.venue ?? match.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="px-4 py-5 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
        <TeamSide name={match.homeTeam ?? "TBD"} flagUrl={homeFlag} code={match.homeCode} align="end" />
        <div className="min-w-[5.5rem]">
          {isFinal ? (
            <div className="flex items-center justify-center gap-2 text-2xl font-black text-white sm:text-3xl">
              <span>{match.homeScore}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">FT</span>
              <span>{match.awayScore}</span>
            </div>
          ) : (
            <p className="text-2xl font-black text-white sm:text-3xl">{kickoffTime}</p>
          )}
        </div>
        <TeamSide name={match.awayTeam ?? "TBD"} flagUrl={awayFlag} code={match.awayCode} align="start" />
      </div>
      {venueLine ? <p className="mt-3 text-xs text-gray-400 sm:text-sm">{venueLine}</p> : null}
    </article>
  );
}

function TeamSide({
  name,
  flagUrl,
  code,
  align,
}: {
  name: string;
  flagUrl: string | null;
  code: string | null;
  align: "start" | "end";
}) {
  const isEnd = align === "end";

  return (
    <div className={`flex items-center gap-2 ${isEnd ? "sm:justify-end" : "sm:justify-start"}`}>
      {isEnd ? (
        <>
          <span className="text-sm font-semibold text-white sm:text-base">{name}</span>
          <TeamFlag flagUrl={flagUrl} code={code} size="lg" />
        </>
      ) : (
        <>
          <TeamFlag flagUrl={flagUrl} code={code} size="lg" />
          <span className="text-sm font-semibold text-white sm:text-base">{name}</span>
        </>
      )}
    </div>
  );
}

function TeamFlag({ flagUrl, code, size }: { flagUrl: string | null; code: string | null; size: "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-6 w-8" : "h-4 w-5";

  if (flagUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={flagUrl} alt="" className={`${dimensions} shrink-0 rounded-sm object-cover`} loading="lazy" />
    );
  }

  return (
    <span
      className={`inline-flex ${dimensions} shrink-0 items-center justify-center rounded-sm bg-white/10 text-[8px] font-black uppercase text-gray-400`}
    >
      {(code ?? "??").slice(0, 3)}
    </span>
  );
}

function StandingsLegend() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] text-gray-400 sm:text-xs">
      <p>
        <span className="mr-2 inline-block h-3 w-0.5 rounded-full bg-emerald-400 align-middle" />
        Qualified for the next round
      </p>
      <p className="mt-2">
        P = Played · W = Wins · D = Draws · L = Losses · GF = Goals For · GA = Goals Against · GD = Goal Difference · Pts = Points
      </p>
      <p className="mt-1">Form: W = Win · D = Draw · L = Loss · - = Not played</p>
      <p className="mt-1">Third-place tab ranks all third-placed teams; highlighted teams advance to the Round of 32.</p>
    </div>
  );
}

type FlagLookup = {
  byCode: Map<string, string | null>;
  byName: Map<string, string | null>;
};

type KnockoutDateSection = {
  key: string;
  label: string;
  matches: KnockoutBracketMatch[];
};

function buildFlagLookup(
  groups: Record<string, WorldCupStandingRow[]>,
  thirdPlace: WorldCupStandingRow[],
): FlagLookup {
  const byCode = new Map<string, string | null>();
  const byName = new Map<string, string | null>();

  for (const row of [...Object.values(groups).flat(), ...thirdPlace]) {
    byCode.set(row.team_code.toUpperCase(), row.flag_url);
    byName.set(row.team_name.trim().toLowerCase(), row.flag_url);
  }

  return { byCode, byName };
}

function resolveFlag(code: string | null, name: string | null, lookup: FlagLookup): string | null {
  if (code) {
    const fromCode = lookup.byCode.get(code.toUpperCase());
    if (fromCode) {
      return fromCode;
    }
  }

  if (name) {
    return lookup.byName.get(name.trim().toLowerCase()) ?? null;
  }

  return null;
}

function groupKnockoutMatchesByDate(rounds: KnockoutBracketRound[]): KnockoutDateSection[] {
  const matches = rounds.flatMap((round) => round.matches.map((match) => ({ ...match, round: match.round || round.round })));
  const grouped = new Map<string, { label: string; matches: KnockoutBracketMatch[]; sortKey: string }>();

  for (const match of matches) {
    const key = match.date ? getLocalDateKeyForInstant(match.date, TIME_ZONE) : `tbd-${match.id}`;
    const label = match.date ? formatKnockoutDateHeader(match.date) : "Date TBD";
    const bucket = grouped.get(key) ?? { label, matches: [], sortKey: key };
    bucket.matches.push(match);
    grouped.set(key, bucket);
  }

  return [...grouped.values()]
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .map((section) => ({
      key: section.sortKey,
      label: section.label,
      matches: section.matches.sort((left, right) => String(left.date).localeCompare(String(right.date))),
    }));
}

function formatKnockoutDateHeader(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatKnockoutKickoff(iso: string | null): string {
  if (!iso) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
