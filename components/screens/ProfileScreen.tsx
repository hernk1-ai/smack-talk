"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { UserAvatar } from "@/components/UserAvatar";
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

const identityTags = ["Heat Seeker", "Crowd Rider", "3x Streak King"];

const socialItems: SocialItem[] = [
  { label: "Followers", value: "4.2K", detail: "Your people", tone: "white" },
  { label: "Following", value: "312", detail: "Rivals watched", tone: "white" },
  { label: "Crew", value: "Soon", detail: "Coming soon", tone: "purple" },
  { label: "Messages", value: "Soon", detail: "Coming soon", tone: "purple" },
];

const recentActivity: ActivityItem[] = [
  {
    type: "Latest lock",
    title: "Knicks upset incoming.",
    meta: "NYK Arena · 2d ago",
    icon: "ϟ",
    tone: "green",
  },
  {
    type: "Latest receipt",
    title: "Curry is choking.",
    meta: "Talk backed up · 2h ago",
    icon: "▤",
    tone: "purple",
  },
  {
    type: "Latest ride/fade",
    title: "Faded the Crowd on Denver.",
    meta: "Heat rising · 4h ago",
    icon: "◌",
    tone: "blue",
  },
];

export function ProfileScreen({ profile }: { profile?: Profile | null }) {
  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} />
      <ProfileIdentityCard profile={profile} />
      <SocialSection />
      <RecentActivity />
    </div>
  );
}

function ProfileHeader({ profile }: { profile?: Profile | null }) {
  const username = profile?.username || "Smack Talk";

  return (
    <header className="rounded-[1.75rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.36)] backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SmackTalkLogo size={58} />
          <div className="min-w-0">
            <h1 className="brand-lockup text-[2rem] leading-[0.82] sm:text-4xl">
              <span className="block text-white">Smack</span>
              <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
                Talk
              </span>
            </h1>
          </div>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-gray-200">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(132,204,22,0.75)]" />
            12.8K <span className="text-gray-400">Online</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400 sm:text-sm">This is me and my people.</p>
        </div>

        <div className="flex items-center gap-2">
          <HeaderIcon label="Notifications" badge="3">
            ♧
          </HeaderIcon>
          <HeaderIcon label={`${username} profile avatar`}>
            <UserAvatar avatarUrl={profile?.avatar_url} initials={getInitials(username)} size="sm" />
          </HeaderIcon>
        </div>
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-xl text-white shadow-[0_0_22px_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-purple-300/35 hover:bg-white/[0.07] active:scale-95"
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

function ProfileIdentityCard({ profile }: { profile?: Profile | null }) {
  const username = profile?.username || "TalkHeavy23";
  const initials = getInitials(username);
  const reputation = profile?.reputation_score ?? profile?.reputation ?? 0;
  const statusLabel = reputation > 0 ? "ϟ Top Talker" : "ϟ Rookie Talker";
  const displayTags = profile
    ? [...identityTags, `${reputation.toLocaleString()} REP`]
    : identityTags;

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
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            initials={initials}
            label={`${username} profile avatar`}
            size="xl"
            active
          />
          <span className="absolute bottom-2 right-0 h-5 w-5 rounded-full border-2 border-black bg-lime-400 shadow-[0_0_18px_rgba(132,204,22,0.9)]" />
        </div>

        <div className="min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 className="text-3xl font-black italic leading-none text-white sm:text-4xl">@{username}</h2>
            <span className="text-sky-300">◆</span>
          </div>

          <span className="mt-3 inline-flex rounded-lg border border-lime-300/40 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
            {statusLabel}
          </span>

          <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-gray-300 md:mx-0">
            I talk it. I lock it. I own it.
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

function SocialSection() {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader eyebrow="Social Hub" title="Your People" action="Share Profile" />
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
}: {
  eyebrow: string;
  title: string;
  action: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{eyebrow}</p>
        <h2 className="sports-display mt-1 text-2xl italic leading-none text-white sm:text-3xl">{title}</h2>
      </div>
      <button type="button" className="rounded-full px-2 py-1 text-xs font-black uppercase text-purple-300 transition hover:bg-purple-500/10 hover:text-purple-100 active:scale-95">
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
