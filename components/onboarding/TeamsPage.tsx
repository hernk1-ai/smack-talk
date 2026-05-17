"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocktLogo } from "@/components/LocktLogo";
import { worldCupGroupOrder, worldCupGroups, type WorldCupGroupKey } from "@/data/worldCupGroups";
import { createClient } from "@/lib/supabase/client";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

const defaultSelected = ["Mexico", "United States"];

export function TeamsPage({ avatar, username }: { avatar?: string; username?: string }) {
  const router = useRouter();
  const [selectedTeams, setSelectedTeams] = useState(defaultSelected);
  const [activeGroup, setActiveGroup] = useState<WorldCupGroupKey>("Group A");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cleanUsername = sanitizeUsername(username) || "LocktFan";
  const cleanAvatar = sanitizeToken(avatar) || "lightning";
  const teams: Array<{ name: string; initials: string }> = worldCupGroups[activeGroup];

  function toggleTeam(teamName: string) {
    setMessage("");
    setSelectedTeams((current) => {
      if (current.includes(teamName)) {
        return current.filter((team) => team !== teamName);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, teamName];
    });
  }

  async function handleContinue() {
    const params = new URLSearchParams({
      username: cleanUsername,
      avatar: cleanAvatar,
      teams: selectedTeams.join(","),
    });

    const supabase = createClient();

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the public URL and anon key.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsLoading(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          username: cleanUsername,
          favorite_teams: selectedTeams,
        },
        { onConflict: "id" },
      );

    setIsLoading(false);

    if (error) {
      setMessage(getUserFacingErrorMessage(error, "Unable to save your teams right now. Try again."));
      return;
    }

    router.push(`/onboarding/enter-arena?${params.toString()}`);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <TeamsAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,920px)] flex-col py-5 sm:py-7">
        <TeamsHeader />

        <section className="mx-auto flex w-full flex-1 flex-col justify-center py-7 text-center sm:py-9">
          <h1 className="sports-display text-[4.2rem] italic leading-[0.82] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.15)] min-[390px]:text-[5rem] sm:text-[7.8rem]">
            Pick your
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
              teams
            </span>
          </h1>
          <p className="mt-5 text-base font-black uppercase tracking-[0.18em] text-gray-300 sm:text-xl">
            Choose up to three teams you want in your feed.
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-400">
            This only personalizes your feed. You&apos;ll make match calls later.
          </p>

          <div className="mt-5 sm:hidden">
            <label className="block rounded-2xl border border-white/16 bg-black/45 p-3 text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Select Group</span>
              <select
                value={activeGroup}
                onChange={(event) => setActiveGroup(event.target.value as WorldCupGroupKey)}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/55 px-3 text-sm font-black uppercase tracking-[0.08em] text-white outline-none"
              >
                {worldCupGroupOrder.map((group) => (
                  <option key={group} value={group} className="bg-[#090b13]">
                    {group}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="hidden sm:block">
            <LeagueTabs activeGroup={activeGroup} onSelect={setActiveGroup} />
          </div>

          <section className="mt-7 rounded-[1.5rem] border border-white/12 bg-black/45 p-4 text-left shadow-[0_22px_72px_rgba(0,0,0,0.48)] sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="sports-display text-3xl italic uppercase tracking-[0.08em] text-white sm:text-4xl">
                {activeGroup}
              </h2>
              <div className="rounded-xl border border-lime-300/55 bg-lime-300/10 px-4 py-2 text-center shadow-[0_0_24px_rgba(132,204,22,0.14)]">
                <p className="scoreboard-number text-3xl text-white">{selectedTeams.length} / 3</p>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">Selected</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {teams.map((team) => {
                const isSelected = selectedTeams.includes(team.name);
                return (
                  <button
                    key={team.name}
                    type="button"
                    onClick={() => toggleTeam(team.name)}
                    className={`relative isolate min-h-32 overflow-hidden rounded-2xl border bg-black/48 p-3 text-center transition hover:-translate-y-0.5 active:scale-[0.98] ${
                      isSelected
                        ? "border-lime-300 shadow-[0_0_28px_rgba(132,204,22,0.25)]"
                        : "border-white/14 hover:border-purple-300/45"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 -z-10 ${
                        isSelected
                          ? "bg-[radial-gradient(circle_at_50%_20%,rgba(132,204,22,0.22),transparent_7rem)]"
                          : "bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.08),transparent_7rem)]"
                      }`}
                    />
                    {isSelected && (
                      <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-lime-300 text-sm font-black text-black shadow-[0_0_20px_rgba(132,204,22,0.45)]">
                        ✓
                      </span>
                    )}
                    <div
                      className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl border text-xl font-black ${
                        isSelected
                          ? "border-lime-300/55 bg-lime-300/10 text-lime-300"
                          : "border-white/16 bg-white/[0.035] text-gray-200"
                      }`}
                    >
                      {team.initials}
                    </div>
                    <p className="mt-4 text-sm font-black uppercase tracking-[0.12em] text-white">{team.name}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isLoading}
            className="mt-8 min-h-16 w-full rounded-2xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-xl font-black uppercase italic tracking-[0.18em] text-black shadow-[0_0_42px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.36)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-20 sm:text-2xl"
          >
            {isLoading ? "Saving..." : "Continue"}
          </button>
          {message && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-gray-200">
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function TeamsHeader() {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <Link
        href="/onboarding/profile-pic"
        className="justify-self-start text-4xl leading-none text-white transition hover:-translate-x-0.5 hover:text-lime-300"
        aria-label="Back to profile pic"
      >
        ←
      </Link>
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
        <LocktLogo size={58} />
        <div className="brand-lockup text-4xl leading-[0.82]">
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
        </div>
      </Link>
      <div className="justify-self-end text-right">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white">Step 3 of 3</p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <span className="h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(132,204,22,0.5)]" />
          <span className="h-px w-7 bg-lime-300/65" />
          <span className="h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(132,204,22,0.5)]" />
          <span className="h-px w-7 bg-white/20" />
          <span className="h-3 w-3 rounded-full bg-white/55" />
        </div>
      </div>
    </header>
  );
}

function sanitizeUsername(value?: string) {
  return (value ?? "").trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function sanitizeToken(value?: string) {
  return (value ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
}

function LeagueTabs({
  activeGroup,
  onSelect,
}: {
  activeGroup: WorldCupGroupKey;
  onSelect: (group: WorldCupGroupKey) => void;
}) {
  return (
    <nav className="mt-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/16 bg-black/45 sm:grid-cols-6">
      {worldCupGroupOrder.map((league) => {
        const isActive = league === activeGroup;
        return (
          <button
            key={league}
            type="button"
            onClick={() => onSelect(league)}
            className={`min-h-16 border-white/10 px-3 py-3 text-sm font-black uppercase tracking-[0.14em] transition sm:border-l sm:first:border-l-0 ${
              isActive
                ? "border-lime-300 bg-lime-300/10 text-lime-300 shadow-[inset_0_-3px_0_rgba(132,204,22,0.8)]"
                : "text-gray-300 hover:bg-white/[0.04] hover:text-purple-300"
            }`}
          >
            <span className="block text-xl">{leagueIcon(league)}</span>
            <span className="mt-1 block">{league}</span>
          </button>
        );
      })}
    </nav>
  );
}

function leagueIcon(league: string) {
  const icons: Record<string, string> = {
    "Group A": "A",
    "Group B": "B",
    "Group C": "C",
    "Group D": "D",
    "Group E": "E",
    "Group F": "F",
    "Group G": "G",
    "Group H": "H",
    "Group I": "I",
    "Group J": "J",
    "Group K": "K",
    "Group L": "L",
  };

  return icons[league] ?? "●";
}

function TeamsAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(168,85,247,0.16),transparent_34rem),radial-gradient(circle_at_12%_44%,rgba(132,204,22,0.15),transparent_30rem),linear-gradient(180deg,rgba(2,4,10,0.62),#02040a_78%)]" />
      <div className="absolute left-0 top-0 h-full w-40 bg-[linear-gradient(105deg,rgba(132,204,22,0.12),transparent)] blur-2xl" />
      <div className="absolute right-0 top-0 h-full w-44 bg-[linear-gradient(255deg,rgba(168,85,247,0.18),transparent)] blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-[28rem] opacity-28 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.12)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_78%)]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
