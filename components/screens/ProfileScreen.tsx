"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ShareActions } from "@/components/ShareActions";
import { UserAvatar } from "@/components/UserAvatar";
import { buildSiteUrl } from "@/lib/site-url";
import { getCurrentUserMatchPicks } from "@/lib/supabase/matchPicks";
import { getCurrentUserTakes } from "@/lib/supabase/takes";
import { getCurrentUserTrophies } from "@/lib/supabase/starterRep";
import type { Profile } from "@/lib/supabase/types";

type SocialItem = {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "purple" | "white";
};

type ActivityItem = {
  type: string;
  title: string;
  meta: string;
  icon: string;
  tone: "green" | "purple" | "blue";
};

const identityTags = ["Tournament Rep Coming Soon", "On Record", "Early Calls Locked"];

const recentActivity: ActivityItem[] = [
  {
    type: "Prep note",
    title: "Groups are set. Early calls are open.",
    meta: "World Cup prep board",
    icon: "◷",
    tone: "green",
  },
  {
    type: "Receipts",
    title: "Receipts unlock when matches begin.",
    meta: "Check the receipt after kickoff",
    icon: "▤",
    tone: "purple",
  },
  {
    type: "Early call",
    title: "Lock your group winners before kickoff.",
    meta: "Called it starts now",
    icon: "◌",
    tone: "blue",
  },
];

export function ProfileScreen({ profile }: { profile?: Profile | null }) {
  const [callsLocked, setCallsLocked] = useState(0);
  const [pendingReceipts, setPendingReceipts] = useState(0);
  const [trophiesCount, setTrophiesCount] = useState(0);
  const [trophies, setTrophies] = useState<Array<{ trophy_name: string; description: string | null }>>([]);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      const [{ takes }, { picks }, { trophies }] = await Promise.all([
        getCurrentUserTakes(),
        getCurrentUserMatchPicks(),
        getCurrentUserTrophies(),
      ]);

      if (!mounted) {
        return;
      }

      setCallsLocked(takes.length + picks.length);
      setPendingReceipts(
        takes.filter((take) => take.status === "locked").length +
          picks.filter((pick) => pick.status === "locked").length,
      );
      setTrophiesCount(trophies.length);
      setTrophies(trophies);
    }

    loadStats().catch(() => null);

    return () => {
      mounted = false;
    };
  }, []);

  const normalizedLevel = getCurrentLocktLevel(profile);
  const socialItems: SocialItem[] = [
    { label: "Rep", value: String(profile?.reputation_score ?? profile?.reputation ?? 0), detail: "Build your rep", tone: "white" },
    { label: "Level", value: normalizedLevel, detail: "Current status", tone: "purple" },
    { label: "Trophies", value: String(trophiesCount), detail: "Unlocked", tone: "white" },
    { label: "Pending Receipts", value: String(pendingReceipts), detail: "Awaiting results", tone: "purple" },
    { label: "Calls Locked", value: String(callsLocked), detail: "World Cup calls", tone: "white" },
  ];

  return (
    <div className="page-rhythm">
      <ProfileHeader profile={profile} />
      <ProfileIdentityCard profile={profile} />
      <SocialSection socialItems={socialItems} />
      <TrophyCase trophies={trophies} />
      <RecentActivity />
    </div>
  );
}

function ProfileHeader({ profile }: { profile?: Profile | null }) {
  return <AppHeader profile={profile} subtitle="Your World Cup reputation profile." rightHref="/receipts" rightAriaLabel="Receipts" />;
}

function ProfileIdentityCard({ profile }: { profile?: Profile | null }) {
  const username = profile?.username || "TalkHeavy23";
  const initials = getInitials(username);
  const statusLabel = `ϟ ${getCurrentLocktLevel(profile)}`;
  const displayTags = identityTags;

  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition hover:border-white/15 sm:p-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(132,204,22,0.2),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,0.2),transparent_34%)]" />

      <Link
        href="/settings"
        aria-label="Settings"
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg text-gray-200 transition hover:-translate-y-0.5 hover:border-purple-300/40 hover:bg-purple-500/10 active:scale-95"
      >
        ⚙
      </Link>

      <div className="grid gap-5 pr-12 md:grid-cols-[auto_1fr] md:items-center md:pr-14">
        <div className="relative mx-auto md:mx-0">
          <Link
            href="/receipts"
            className="block rounded-full transition hover:scale-[1.02] active:scale-[0.98]"
            aria-label={`${username} receipts identity`}
          >
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              initials={initials}
              label={`${username} profile avatar`}
              size="xl"
              active
            />
          </Link>
          <span className="absolute bottom-2 right-0 h-5 w-5 rounded-full border-2 border-black bg-lime-400 shadow-[0_0_18px_rgba(132,204,22,0.9)]" />
        </div>

        <div className="min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Link
              href="/receipts"
              className="text-3xl font-black italic leading-none text-white transition hover:text-lime-100 sm:text-4xl"
            >
              @{username}
            </Link>
            <span className="text-sky-300">◆</span>
          </div>

          <span className="mt-3 inline-flex rounded-lg border border-lime-300/40 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
            {statusLabel}
          </span>

          <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-gray-300 md:mx-0">
            Lock your call. Check the receipt. Called it.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-black uppercase text-gray-300 shadow-[0_0_14px_rgba(255,255,255,0.03)]"
              >
                {tag}
              </span>
            ))}
          </div>
          {profile?.favorite_teams?.length ? (
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">
              Riding with {profile.favorite_teams.slice(0, 4).join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function getCurrentLocktLevel(profile?: Profile | null) {
  const hasFirstLock =
    Boolean(profile?.starter_rep_awarded) ||
    (profile?.created_takes_count ?? 0) > 0 ||
    (profile?.reputation_score ?? profile?.reputation ?? 0) > 0;
  return hasFirstLock ? "Player" : "Rookie";
}

function SocialSection({ socialItems }: { socialItems: SocialItem[] }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader
        eyebrow="Social Hub"
        title="Your People"
        action={shareOpen ? "Hide Share" : "Share Profile"}
        onAction={() => setShareOpen((current) => !current)}
      />
      {shareOpen ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/45 p-3">
          <ShareActions
            type="profile"
            title="Share Profile"
            text="Follow my World Cup calls on Lockt."
            caption="Follow my World Cup calls on Lockt."
            url={buildSiteUrl("/profile")}
          />
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3 min-[430px]:grid-cols-3 md:grid-cols-4">
        {socialItems.map((item) => (
          <SocialCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

function SocialCard({ item }: { item: SocialItem }) {
  const toneClass = {
    green: "text-lime-300 border-lime-300/25 bg-lime-400/10",
    purple: "text-purple-300 border-purple-300/25 bg-purple-500/10",
    white: "text-white border-white/10 bg-white/[0.035]",
  }[item.tone];

  return (
    <article className={`rounded-2xl border p-3 text-center transition hover:-translate-y-0.5 hover:bg-white/[0.05] active:scale-[0.985] ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">{item.label}</p>
      <p className={`scoreboard-number mt-2 text-3xl ${toneClass.split(" ")[0]}`}>{item.value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-gray-500">{item.detail}</p>
    </article>
  );
}

function RecentActivity() {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader eyebrow="Recent Activity" title="Latest From You" action="See all" />
      <div className="mt-4 grid gap-3">
        {recentActivity.map((item) => (
          <ActivityRow key={item.type} item={item} />
        ))}
      </div>
    </section>
  );
}

function TrophyCase({ trophies }: { trophies: Array<{ trophy_name: string; description: string | null }> }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader eyebrow="Trophy Case" title="Unlocked Trophies" action="Receipts" />
      {trophies.length ? (
        <div className="mt-3 grid gap-2">
          {trophies.map((trophy) => (
            <article key={trophy.trophy_name} className="rounded-xl border border-lime-300/25 bg-lime-400/10 p-3">
              <p className="text-sm font-black text-lime-100">🏆 {trophy.trophy_name}</p>
              <p className="mt-1 text-xs font-semibold text-gray-200">{trophy.description ?? "Trophy unlocked."}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-gray-300">
          No trophies yet. Make your first World Cup call to unlock your first one.
        </p>
      )}
    </section>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const toneClass = {
    green: "border-lime-300/25 bg-lime-400/10 text-lime-300",
    purple: "border-purple-300/25 bg-purple-500/10 text-purple-300",
    blue: "border-sky-300/25 bg-sky-500/10 text-sky-300",
  }[item.tone];

  return (
    <article className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.035] active:scale-[0.985]">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl border text-xl ${toneClass}`}>
        {item.icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">{item.type}</p>
        <h3 className="mt-1 truncate text-base font-black text-white">{item.title}</h3>
        <p className="mt-1 truncate text-xs font-semibold text-gray-400">{item.meta}</p>
      </div>
      <span className="text-2xl text-gray-500">›</span>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{eyebrow}</p>
        <h2 className="sports-display mt-1 text-2xl italic leading-none text-white sm:text-3xl">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="rounded-full px-2 py-1 text-xs font-black uppercase text-purple-300 transition hover:bg-purple-500/10 hover:text-purple-100 active:scale-95"
      >
        {action}
      </button>
    </div>
  );
}

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}
