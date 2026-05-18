"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { FollowButton } from "@/components/social/FollowButton";
import { RouteBottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/providers/ToastProvider";
import { UserAvatar } from "@/components/UserAvatar";
import { playSound } from "@/lib/sound";
import { getCurrentUserId, getFollowStatus, getFollowingList, getPendingFollowRequests, respondToFollowRequest, searchProfiles } from "@/lib/supabase/follows";
import { createClient } from "@/lib/supabase/client";
import type { Follow, Profile } from "@/lib/supabase/types";

type ProfileSearchCard = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  account_visibility?: Profile["account_visibility"];
};

export function FollowingPage() {
  const { showToast } = useToast();
  const [following, setFollowing] = useState<ProfileSearchCard[]>([]);
  const [requests, setRequests] = useState<Array<{ id: string; followerId: string; username: string | null; avatarUrl: string | null }>>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileSearchCard[]>([]);
  const [statusByUser, setStatusByUser] = useState<Record<string, Follow["status"] | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const [{ users }, { requests: pendingRequests }] = await Promise.all([getFollowingList(), getPendingFollowRequests()]);
      if (!mounted) return;
      setFollowing(users as ProfileSearchCard[]);
      if (pendingRequests.length && supabase) {
        const ids = pendingRequests.map((request) => request.follower_id);
        const { data: cards } = await supabase.from("profile_cards").select("*").in("id", ids);
        const cardMap = new Map((cards ?? []).map((card) => [card.id, card]));
        if (!mounted) return;
        setRequests(
          pendingRequests.map((request) => ({
            id: request.id,
            followerId: request.follower_id,
            username: cardMap.get(request.follower_id)?.username ?? null,
            avatarUrl: cardMap.get(request.follower_id)?.avatar_url ?? null,
          })),
        );
      } else {
        setRequests([]);
      }
      if (userId && supabase) {
        const { data: statuses } = await supabase.from("follows").select("following_id, status").eq("follower_id", userId);
        if (!mounted) return;
        setStatusByUser(
          Object.fromEntries((statuses ?? []).map((row) => [row.following_id, row.status as Follow["status"]])),
        );
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function runSearch() {
      const clean = search.trim();
      if (!clean) {
        setSearchResults([]);
        return;
      }
      const { users } = await searchProfiles(clean);
      if (!mounted) return;
      if (!users.length) {
        setSearchResults([]);
        return;
      }
      const ids = users.map((user) => user.id);
      setSearchResults(users as ProfileSearchCard[]);
      await Promise.all(
        ids.map(async (id) => {
          const { follow } = await getFollowStatus(id);
          if (!mounted) return;
          setStatusByUser((current) => ({ ...current, [id]: follow?.status ?? current[id] ?? null }));
        }),
      );
    }
    runSearch();
    return () => {
      mounted = false;
    };
  }, [search]);

  const visibleSearchResults = useMemo(() => searchResults.slice(0, 20), [searchResults]);

  async function handleRequestAction(requestId: string, approve: boolean) {
    const { error } = await respondToFollowRequest(requestId, approve);
    if (!error) {
      setRequests((current) => current.filter((item) => item.id !== requestId));
      playSound(approve ? "follow_accepted" : "success");
      showToast(approve ? "Follow request accepted." : "Follow request declined.", "success");
    } else {
      playSound("error");
      showToast("Unable to save right now.", "error");
    }
  }

  return (
    <>
      <main className="min-h-dvh bg-black px-4 py-6 pb-28 text-white">
        <div className="page-rhythm mx-auto w-full max-w-2xl screen-safe-bottom">
          <AppHeader subtitle="Find people on LOCKT and manage follow requests." rightHref="/receipts" rightAriaLabel="Receipts" />

          <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
            <h1 className="sports-display text-3xl italic leading-none text-white">Following</h1>
            <p className="mt-2 text-sm font-semibold text-gray-300">Find people on LOCKT and manage follow requests.</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-3">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-gray-400">Find people on LOCKT</p>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username"
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-sm font-semibold text-white outline-none"
            />
            {search.trim() && !visibleSearchResults.length ? (
              <p className="mt-2 text-xs font-semibold text-gray-400">No results.</p>
            ) : null}
            <div className="mt-2 space-y-2">
              {visibleSearchResults.map((user) => (
                <div key={user.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-black/45 p-2">
                  <UserAvatar avatarUrl={user.avatar_url ?? null} initials={getInitials(user.username ?? "Talker")} size="sm" />
                  <Link href={`/u/${encodeURIComponent((user.username ?? "talker").toLowerCase())}`} className="text-sm font-black text-white">
                    @{(user.username ?? "talker").replace(/^@/, "")}
                    {user.account_visibility === "private" ? <span className="ml-2 text-[10px] uppercase text-purple-300">Private</span> : null}
                  </Link>
                  <FollowButton
                    targetUserId={user.id}
                    targetAccountVisibility={user.account_visibility ?? "public"}
                    currentFollowStatus={statusByUser[user.id] ?? null}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-3">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-lime-300">Follow Requests</p>
            <div className="mt-2 space-y-2">
              {requests.length ? (
                requests.map((request) => (
                  <div key={request.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-black/45 p-2">
                    <UserAvatar avatarUrl={request.avatarUrl} initials={getInitials(request.username ?? "Talker")} size="sm" />
                    <Link href={`/u/${encodeURIComponent((request.username ?? "talker").toLowerCase())}`} className="text-sm font-black text-white">
                      @{(request.username ?? "talker").replace(/^@/, "")}
                    </Link>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleRequestAction(request.id, true)} className="min-h-9 rounded-lg border border-lime-300/40 bg-lime-400/10 px-2 text-[10px] font-black uppercase text-lime-200">Accept</button>
                      <button type="button" onClick={() => handleRequestAction(request.id, false)} className="min-h-9 rounded-lg border border-white/15 bg-white/[0.03] px-2 text-[10px] font-black uppercase text-gray-300">Decline</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-gray-400">No follow requests.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-3">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-purple-300">Currently Following</p>
            {loading ? <p className="mt-2 text-sm font-semibold text-gray-400">Loading...</p> : null}
            {!loading && !following.length ? <p className="mt-2 text-sm font-semibold text-gray-400">You are not following anyone yet.</p> : null}
            <div className="mt-2 space-y-2">
              {following.map((user) => (
                <Link key={user.id} href={`/u/${encodeURIComponent((user.username ?? "talker").toLowerCase())}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-black/45 p-2">
                  <UserAvatar avatarUrl={user.avatar_url} initials={getInitials(user.username ?? "Talker")} size="sm" />
                  <p className="text-sm font-black text-white">@{(user.username ?? "talker").replace(/^@/, "")}</p>
                  <span className="text-xl text-gray-500">›</span>
                </Link>
              ))}
            </div>
          </section>
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
