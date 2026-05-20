"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { RouteBottomNav } from "@/components/BottomNav";
import { UserAvatar } from "@/components/UserAvatar";
import { getFollowersList } from "@/lib/supabase/follows";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

type FollowerCard = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export function FollowersPage() {
  const [followers, setFollowers] = useState<FollowerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { users, error: loadError } = await getFollowersList();
      if (!mounted) return;
      setFollowers(users as FollowerCard[]);
      setError(loadError ? getUserFacingErrorMessage(loadError, "Could not load followers right now.") : "");
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <main className="min-h-dvh bg-black px-4 py-6 pb-28 text-white">
        <div className="page-rhythm mx-auto w-full max-w-2xl screen-safe-bottom">
          <AppHeader subtitle="People following your World Cup calls." rightAriaLabel="Receipts" />

          <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
            <h1 className="sports-display text-3xl italic leading-none text-white">Followers</h1>
            <p className="mt-2 text-sm font-semibold text-gray-300">People following your World Cup calls.</p>
          </section>

          {loading ? <p className="text-sm font-semibold text-gray-400">Loading followers...</p> : null}
          {error ? <p className="text-sm font-semibold text-red-300">{error}</p> : null}
          {!loading && !followers.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
              <p className="text-sm font-semibold text-gray-300">No followers yet.</p>
            </div>
          ) : null}

          <div className="space-y-2">
            {followers.map((follower) => (
              <Link
                key={follower.id}
                href={`/u/${encodeURIComponent((follower.username ?? "talker").toLowerCase())}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3"
              >
                <UserAvatar avatarUrl={follower.avatar_url} initials={getInitials(follower.username ?? "Talker")} size="sm" />
                <p className="text-sm font-black text-white">@{(follower.username ?? "talker").replace(/^@/, "")}</p>
                <span className="text-xl text-gray-500">›</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <RouteBottomNav activeView="receipts" />
    </>
  );
}

function getInitials(username: string) {
  const clean = username.replace(/^@/, "").trim();
  return clean.slice(0, 2).toUpperCase() || "ST";
}
