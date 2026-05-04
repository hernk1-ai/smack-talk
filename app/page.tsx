"use client";

import { useEffect, useState } from "react";

type Status = "live" | "won" | "lost";

type Post = {
  id: number;
  user: string;
  text: string;
  game: string;
  riders: number;
  faders: number;
  status: Status;
  minutesAgo: number;
  isUnderdog?: boolean;
  justResolved?: boolean;
};

const startingPosts: Post[] = [
  {
    id: 1,
    user: "@hernk1",
    text: "Lakers by 10. Not even close.",
    game: "Lakers vs Warriors",
    riders: 62,
    faders: 55,
    status: "live",
    minutesAgo: 10,
  },
  {
    id: 2,
    user: "@talkking",
    text: "Free money. Easiest win tonight.",
    game: "Celtics vs Heat",
    riders: 90,
    faders: 10,
    status: "lost",
    minutesAgo: 3,
  },
  {
    id: 3,
    user: "@icecold",
    text: "Knicks upset. Watch.",
    game: "Knicks vs Bucks",
    riders: 12,
    faders: 40,
    status: "won",
    minutesAgo: 5,
    isUnderdog: true,
  },
  {
    id: 4,
    user: "@midrange",
    text: "Suns are frauds tonight.",
    game: "Suns vs Mavs",
    riders: 25,
    faders: 22,
    status: "live",
    minutesAgo: 15,
  },
  {
    id: 5,
    user: "@safeplay",
    text: "Celtics win. Boring but true.",
    game: "Celtics vs Heat",
    riders: 80,
    faders: 5,
    status: "live",
    minutesAgo: 8,
  },
];

function getScore(post: Post) {
  const total = post.riders + post.faders;

  const recency =
    post.minutesAgo < 5
      ? 1
      : post.minutesAgo < 30
        ? 0.8
        : post.minutesAgo < 120
          ? 0.6
          : 0.2;

  const engagement = Math.log(total + 1) / Math.log(100);

  const conflict =
    total === 0 ? 0 : 1 - Math.abs(post.riders - post.faders) / total;

  let outcomeEnergy = 0;

  if (post.status === "won") outcomeEnergy = 0.7;
  if (post.status === "lost") outcomeEnergy = 0.9;
  if (post.status === "won" && post.isUnderdog) outcomeEnergy += 0.3;
  if (post.status === "lost" && post.riders > post.faders) {
    outcomeEnergy += 0.25;
  }
  if (post.justResolved) outcomeEnergy += 0.35;

  return (
    recency * 0.35 +
    engagement * 0.25 +
    conflict * 0.2 +
    Math.min(outcomeEnergy, 1) * 0.15
  );
}

function getBadge(post: Post) {
  if (post.status === "live") return "🟡 LIVE";
  if (post.status === "won") return "🟢 TALK BACKED UP";
  return "🔴 DIDN’T AGE WELL";
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(startingPosts);
  const [myChoices, setMyChoices] = useState<Record<number, "ride" | "fade">>(
    {},
  );
  const [callText, setCallText] = useState("");
  const [gameText, setGameText] = useState("Lakers vs Warriors");
  const [lastUpdate, setLastUpdate] = useState("");

useEffect(() => {
  const timer = setInterval(() => {
    setPosts((prev) => {
      const livePosts = prev.filter((post) => post.status === "live");

      if (livePosts.length === 0) return prev;

      // Only resolve occasionally (30% chance)
      if (Math.random() > 0.3) {
        return prev.map((post) => ({
          ...post,
          minutesAgo: post.minutesAgo + 1,
          justResolved: false,
        }));
      }

      const postToResolve =
        livePosts[Math.floor(Math.random() * livePosts.length)];

      const total = postToResolve.riders + postToResolve.faders;

const rideRatio =
  total === 0 ? 0.5 : postToResolve.riders / total;

// More riders = slightly better chance to win
// More faders = slightly worse chance to win
const winChance = Math.min(0.85, Math.max(0.15, rideRatio));

const result: Status = Math.random() < winChance ? "won" : "lost";

      setLastUpdate(
        result === "won"
          ? `${postToResolve.user} just backed up their talk.`
          : `${postToResolve.user} just got exposed.`,
      );

      return prev.map((post) =>
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
      );
    });
  }, 9000);

  return () => clearInterval(timer);
}, []);

  function updatePost(id: number, type: "ride" | "fade") {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              riders:
                type === "ride" && myChoices[id] !== "ride"
                  ? post.riders + 1
                  : post.riders,
              faders:
                type === "fade" && myChoices[id] !== "fade"
                  ? post.faders + 1
                  : post.faders,
            }
          : post,
      ),
    );

    setMyChoices((prev) => ({
      ...prev,
      [id]: type,
    }));
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
    };

    setPosts([newPost, ...posts]);
    setCallText("");
    setLastUpdate("Your call is live. No switching sides.");
  }

  const activeMyCalls = posts.filter(
    (post) => post.user === "@hernk1" && post.status === "live",
  ).length;

  const rankedPosts = [...posts].sort((a, b) => getScore(b) - getScore(a));

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <h1 className="text-3xl font-black">Smack Talk</h1>
          <p className="text-sm text-gray-400">
            Talk it. Lock it. Live with it.
          </p>
        </header>

        <div className="mb-4 rounded-2xl border border-yellow-700/40 bg-yellow-500/10 p-4">
          <p className="text-sm font-bold text-yellow-300">
            🟡 You have {activeMyCalls} active calls
          </p>
          <p className="mt-1 text-xs text-yellow-100/70">
            Check back soon. Somebody&apos;s about to get exposed.
          </p>
        </div>

        {lastUpdate && (
          <div className="mb-4 rounded-2xl border border-purple-700/40 bg-purple-500/10 p-4">
            <p className="text-sm font-bold text-purple-200">⚡ Live update</p>
            <p className="mt-1 text-sm text-purple-100">{lastUpdate}</p>
          </div>
        )}

        <div className="mb-5 rounded-2xl border border-gray-800 bg-gray-950 p-4">
          <p className="mb-3 text-sm font-bold text-gray-300">
            Make your call
          </p>

          <select
            value={gameText}
            onChange={(e) => setGameText(e.target.value)}
            className="mb-3 w-full rounded-xl border border-gray-800 bg-black p-3 text-sm text-white"
          >
            <option>Lakers vs Warriors</option>
            <option>Celtics vs Heat</option>
            <option>Knicks vs Bucks</option>
            <option>Suns vs Mavs</option>
          </select>

          <textarea
            value={callText}
            onChange={(e) => setCallText(e.target.value)}
            placeholder="Say it with your chest..."
            className="h-24 w-full resize-none rounded-xl border border-gray-800 bg-black p-3 text-sm text-white placeholder:text-gray-600"
          />

          <button
            onClick={lockCall}
            className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-black text-black"
          >
            Lock It 🔒
          </button>

          <p className="mt-2 text-center text-xs text-gray-500">
            Locked. No switching sides.
          </p>
        </div>

        <section className="space-y-4 pb-24">
          {rankedPosts.map((post) => (
            <div
              key={post.id}
              className={`rounded-2xl border p-4 ${
                post.justResolved
                  ? "border-purple-500 bg-purple-950/40"
                  : post.status === "lost"
                    ? "border-red-900/50 bg-red-950/30"
                    : post.status === "won"
                      ? "border-green-900/50 bg-green-950/30"
                      : "border-gray-800 bg-gray-950"
              }`}
            >
              <div className="mb-2 flex justify-between gap-3">
                <span className="text-sm text-gray-400">{post.user}</span>
                <span className="text-right text-xs font-bold">
                  {getBadge(post)}
                </span>
              </div>

              <p className="text-xs uppercase tracking-wide text-gray-500">
                {post.game}
              </p>

              <p className="mt-2 text-lg font-bold leading-tight">
                “{post.text}”
              </p>

              <div className="mt-3 flex justify-between text-sm">
                <span>🔥 {post.riders} riding</span>
                <span>💀 {post.faders} fading</span>
              </div>

              {myChoices[post.id] && (
                <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold">
                  You&apos;re{" "}
                  {myChoices[post.id] === "ride" ? "riding" : "fading"} this.
                </p>
              )}

              {post.status === "live" && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updatePost(post.id, "ride")}
                    className={`rounded-xl py-2 text-sm font-bold ${
                      myChoices[post.id] === "ride"
                        ? "bg-green-400 text-black"
                        : "bg-green-600"
                    }`}
                  >
                    Ride
                  </button>

                  <button
                    onClick={() => updatePost(post.id, "fade")}
                    className={`rounded-xl py-2 text-sm font-bold ${
                      myChoices[post.id] === "fade"
                        ? "bg-red-400 text-black"
                        : "bg-red-600"
                    }`}
                  >
                    Fade
                  </button>
                </div>
              )}

              {post.status === "lost" && (
                <p className="mt-3 text-sm text-gray-300">
                  💀 {post.riders} people saw this collapse
                </p>
              )}

              {post.status === "won" && (
                <p className="mt-3 text-sm text-gray-300">
                  Talk backed up. Receipt secured.
                </p>
              )}

              {post.justResolved && (
                <p className="mt-3 rounded-xl bg-purple-500/20 px-3 py-2 text-center text-xs font-black text-purple-100">
                  JUST RESOLVED — CHECK THE RECEIPT
                </p>
              )}
            </div>
          ))}
        </section>

        <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-black/95 px-4 py-3">
          <div className="mx-auto grid max-w-md grid-cols-4 text-center text-xs font-bold">
            <span className="text-white">Feed</span>
            <span className="text-gray-500">Receipts</span>
            <span className="text-gray-500">Top Talkers</span>
            <span className="text-gray-500">Profile</span>
          </div>
        </nav>
      </div>
    </main>
  );
}