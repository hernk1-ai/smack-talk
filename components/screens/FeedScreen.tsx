"use client";

import { useEffect, useMemo, useState } from "react";
import { FeedCard } from "@/components/FeedCard";
import {
  type CallReactionCounts,
  type CallReactionKey,
  type Choice,
  type Post,
  type Status,
  calculateHeatScore,
  createLivePosts,
  defaultCallReactionCounts,
  getRandomActivityMessage,
  randomInt,
  splitFeedSections,
  startingPosts,
} from "@/utils/liveFeed";

type ReactionCountsByPost = Record<number, CallReactionCounts>;

export function FeedScreen({ onEnterArena }: { onEnterArena: () => void }) {
  const [posts, setPosts] = useState<Post[]>(() => createLivePosts(startingPosts));
  const [myChoices, setMyChoices] = useState<Record<number, Choice>>({});
  const [reactionCounts, setReactionCounts] = useState<ReactionCountsByPost>(() => buildReactionCounts(startingPosts));
  const [reactionFlashKey, setReactionFlashKey] = useState<string>();
  const [callText, setCallText] = useState("");
  const [gameText, setGameText] = useState("Lakers vs Warriors");
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setPosts((prev) => {
        const livePosts = prev.filter((post) => post.status === "live");

        if (livePosts.length === 0) return prev;

        if (Math.random() > 0.3) {
          return simulateMomentum(
            prev.map((post) => ({
              ...post,
              minutesAgo: post.minutesAgo + 1,
              justResolved: false,
            })),
          );
        }

        const postToResolve = livePosts[Math.floor(Math.random() * livePosts.length)];
        const total = postToResolve.riders + postToResolve.faders;
        const rideRatio = total === 0 ? 0.5 : postToResolve.riders / total;
        const winChance = Math.min(0.85, Math.max(0.15, rideRatio));
        const result: Status = Math.random() < winChance ? "won" : "lost";

        setLastUpdate(
          result === "won"
            ? `${postToResolve.user} just backed up their talk.`
            : `${postToResolve.user} just got exposed.`,
        );

        return simulateMomentum(
          prev.map((post) =>
            post.id === postToResolve.id
              ? {
                  ...post,
                  status: result,
                  minutesAgo: 0,
                  justResolved: true,
                }
              : {
                  ...post,
                  justResolved: false,
                  minutesAgo: post.minutesAgo + 1,
                },
          ),
        );
      });
    }, randomInt(3000, 6000));

    return () => clearInterval(timer);
  }, []);

  const feedSections = useMemo(() => splitFeedSections(posts), [posts]);
  const activeMyCalls = posts.filter((post) => post.user === "@hernk1" && post.status === "live").length;

  function updatePost(id: number, type: Choice) {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== id) return post;

        const updatedPost = {
          ...post,
          riders: type === "ride" && myChoices[id] !== "ride" ? post.riders + 1 : post.riders,
          faders: type === "fade" && myChoices[id] !== "fade" ? post.faders + 1 : post.faders,
          activityBoost: (post.activityBoost ?? 0) + 3,
          activityText: type === "ride" ? "🔥 12 people just rode" : "💀 Getting faded hard",
        };

        return {
          ...updatedPost,
          heatScore: calculateHeatScore(updatedPost),
        };
      }),
    );

    setMyChoices((prev) => ({
      ...prev,
      [id]: type,
    }));
  }

  function handleCallReaction(id: number, reaction: CallReactionKey) {
    setReactionCounts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? defaultCallReactionCounts),
        [reaction]: (prev[id]?.[reaction] ?? defaultCallReactionCounts[reaction]) + 1,
      },
    }));
    setReactionFlashKey(`${id}-${reaction}`);
    window.setTimeout(() => setReactionFlashKey(undefined), 260);
  }

  function lockCall() {
    if (!callText.trim()) return;

    const newPost: Post = {
      id: Date.now(),
      user: "@hernk1",
      text: callText,
      game: gameText,
      riders: 0,
      faders: 0,
      status: "live",
      minutesAgo: 0,
      activityBoost: 6,
      activityText: "👀 Picking up traction",
    };

    const livePost = {
      ...newPost,
      heatScore: calculateHeatScore(newPost),
    };

    setPosts((prev) => [livePost, ...prev]);
    setReactionCounts((prev) => ({
      ...prev,
      [newPost.id]: defaultCallReactionCounts,
    }));
    setCallText("");
    setLastUpdate("Your call is live. No switching sides.");
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-yellow-700/40 bg-yellow-500/10 p-4">
        <p className="text-sm font-bold text-yellow-300">🟡 You have {activeMyCalls} active calls</p>
        <p className="mt-1 text-xs text-yellow-100/70">Check back soon. Somebody&apos;s about to get exposed.</p>
      </div>

      <button
        onClick={onEnterArena}
        className="mb-4 w-full rounded-3xl border border-green-400/30 bg-gradient-to-br from-gray-950 via-gray-950 to-green-950/70 p-4 text-left shadow-[0_0_28px_rgba(45,212,191,0.12)] transition active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-green-300">Enter Live Arena</p>
            <h2 className="mt-2 text-xl font-black">🏀 NBA Playoffs</h2>
            <p className="mt-1 text-sm font-bold text-gray-200">LAL 102 — 99 GSW</p>
            <p className="mt-1 text-xs font-black text-red-200">LIVE · 4th QTR · 3:42</p>
          </div>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-black">Enter</span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="h-2 overflow-hidden rounded-full bg-gray-900">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-green-400 to-teal-300" />
          </div>
          <p className="text-xs font-black text-gray-300">12.8K watching</p>
        </div>
      </button>

      {lastUpdate && (
        <div className="mb-4 rounded-2xl border border-purple-700/40 bg-purple-500/10 p-4">
          <p className="text-sm font-bold text-purple-200">⚡ Live update</p>
          <p className="mt-1 text-sm text-purple-100">{lastUpdate}</p>
        </div>
      )}

      <div className="mb-5 rounded-2xl border border-gray-800 bg-gray-950 p-4">
        <p className="mb-3 text-sm font-bold text-gray-300">Make your call</p>

        <select
          value={gameText}
          onChange={(event) => setGameText(event.target.value)}
          className="mb-3 w-full rounded-xl border border-gray-800 bg-black p-3 text-sm text-white"
        >
          <option>Lakers vs Warriors</option>
          <option>Celtics vs Heat</option>
          <option>Knicks vs Bucks</option>
          <option>Suns vs Mavs</option>
        </select>

        <textarea
          value={callText}
          onChange={(event) => setCallText(event.target.value)}
          placeholder="Say it with your chest..."
          className="h-24 w-full resize-none rounded-xl border border-gray-800 bg-black p-3 text-sm text-white placeholder:text-gray-600"
        />

        <button onClick={lockCall} className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-black text-black">
          Lock It 🔒
        </button>

        <p className="mt-2 text-center text-xs text-gray-500">Locked. No switching sides.</p>
      </div>

      <section className="space-y-7 pb-24">
        {feedSections.map((section) => (
          <section key={section.id} className="space-y-3" aria-labelledby={`${section.id}-heading`}>
            <div className="flex items-center justify-between px-1">
              <h2 id={`${section.id}-heading`} className="text-base font-black">
                {section.title}
              </h2>
              <span className="text-xs font-bold text-gray-500">{section.posts.length} live</span>
            </div>

            <div className="space-y-4">
              {section.posts.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  choice={myChoices[post.id]}
                  reactionCounts={reactionCounts[post.id] ?? defaultCallReactionCounts}
                  reactionFlashKey={reactionFlashKey}
                  onChoose={updatePost}
                  onCallReaction={handleCallReaction}
                />
              ))}
            </div>
          </section>
        ))}
      </section>
    </>
  );
}

function buildReactionCounts(posts: Post[]) {
  return posts.reduce<ReactionCountsByPost>((counts, post, index) => {
    counts[post.id] = {
      fire: defaultCallReactionCounts.fire + (index % 4),
      cooked: defaultCallReactionCounts.cooked + (index % 3),
      sharp: defaultCallReactionCounts.sharp + (index % 5),
    };
    return counts;
  }, {});
}

function simulateMomentum(posts: Post[]) {
  if (!posts.length) return posts;

  const targetCount = Math.random() > 0.75 ? 2 : 1;
  const targetIds = new Set<number>();

  while (targetIds.size < Math.min(targetCount, posts.length)) {
    targetIds.add(posts[Math.floor(Math.random() * posts.length)].id);
  }

  return posts.map((post) => {
    if (!targetIds.has(post.id) || post.status !== "live") return post;

    const rideJump = Math.random() > 0.48 ? randomInt(1, 4) : 0;
    const fadeJump = rideJump === 0 ? randomInt(1, 4) : Math.random() > 0.7 ? 1 : 0;
    const updatedPost = {
      ...post,
      riders: post.riders + rideJump,
      faders: post.faders + fadeJump,
      activityBoost: Math.min((post.activityBoost ?? 0) + randomInt(1, 8), 32),
      activityText: getRandomActivityMessage(),
    };

    return {
      ...updatedPost,
      heatScore: calculateHeatScore(updatedPost),
    };
  });
}
