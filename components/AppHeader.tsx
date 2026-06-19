"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LocktLogo } from "@/components/LocktLogo";
import { NotificationBell } from "@/components/social/NotificationBell";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import {
  SHOW_FAKE_LIVE_ACTIVITY,
  SHOW_FOLLOW_SYSTEM_PUBLICLY,
  SHOW_PROFILES,
} from "@/lib/productConfig";
import type { Profile } from "@/lib/supabase/types";

export function AppHeader({
  subtitle,
  profile,
  rightAriaLabel = "Account",
}: {
  subtitle: string;
  profile?: Profile | null;
  rightAriaLabel?: string;
}) {
  const [resolvedProfile, setResolvedProfile] = useState<Profile | null>(null);
  const displayProfile = profile ?? resolvedProfile;
  const username = displayProfile?.username || "LOCKT";
  const accountHref = SHOW_PROFILES ? "/profile" : "/settings";

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentProfile() {
      if (profile) {
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      setResolvedProfile((data as Profile | null) ?? null);
    }

    void loadCurrentProfile();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  return (
    <header className="app-header-shell relative z-40 rounded-[1.75rem] border border-white/10 bg-black/35 px-3 py-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.36)] backdrop-blur sm:px-3.5 sm:py-3">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 sm:gap-3">
        <Link href="/app" className="flex min-w-0 items-center gap-2.5 transition hover:-translate-y-0.5 sm:gap-3" aria-label="Go to Match Hub">
          <LocktLogo size={54} />
          <div className="min-w-0">
            <h1 className="brand-lockup text-[1.8rem] leading-[0.82] sm:text-4xl">
              <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
            </h1>
          </div>
        </Link>

        <div className="min-w-0">
          {SHOW_FAKE_LIVE_ACTIVITY ? (
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-gray-200 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_16px_rgba(132,204,22,0.75)]" />
              12.8K <span className="text-gray-400">Online</span>
            </p>
          ) : null}
          <p className={`max-w-[24ch] text-xs font-semibold leading-tight text-gray-400 sm:max-w-[46ch] sm:text-sm ${SHOW_FAKE_LIVE_ACTIVITY ? "mt-0.5" : ""}`}>
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {SHOW_FOLLOW_SYSTEM_PUBLICLY ? <NotificationBell /> : null}
          <Link
            href={accountHref}
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-xl text-white shadow-[0_0_22px_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-purple-300/35 hover:bg-white/[0.07] active:scale-95 sm:h-12 sm:w-12"
            aria-label={rightAriaLabel}
          >
            <UserAvatar avatarUrl={displayProfile?.avatar_url} initials={getInitials(username)} size="sm" />
          </Link>
        </div>
      </div>
    </header>
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
