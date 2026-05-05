export type Status = "live" | "won" | "lost";
export type Choice = "ride" | "fade";
export type CallReactionKey = "fire" | "cooked" | "sharp";
export type CallReactionCounts = Record<CallReactionKey, number>;

export type Post = {
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
  heatScore?: number;
  activityBoost?: number;
  activityText?: string;
};

export type FeedSection = {
  id: "trending" | "new" | "cold";
  title: string;
  posts: Post[];
};

export const startingPosts: Post[] = [
  {
    id: 1,
    user: "@hk1",
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
    text: "Easiest call tonight. Screenshot this.",
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

export const callReactionLabels: Record<CallReactionKey, string> = {
  fire: "🔥 This is free",
  cooked: "💀 This is cooked",
  sharp: "🧠 Sharp",
};

export const defaultCallReactionCounts: CallReactionCounts = {
  fire: 4,
  cooked: 2,
  sharp: 3,
};

export const activityMessages = [
  "🔥 12 people just rode",
  "👀 Picking up traction",
  "💀 Getting faded hard",
];

export function calculateHeatScore(post: Pick<Post, "riders" | "faders"> & { activityBoost?: number }) {
  return post.riders + post.faders + (post.activityBoost ?? 0);
}

export function createLivePosts(posts: Post[]) {
  return posts.map((post, index) => {
    const activityBoost = post.activityBoost ?? index % 3;

    return {
      ...post,
      activityBoost,
      heatScore: calculateHeatScore({ ...post, activityBoost }),
      activityText: post.activityText ?? activityMessages[index % activityMessages.length],
    };
  });
}

export function splitFeedSections(posts: Post[]): FeedSection[] {
  const sortedByHeat = [...posts].sort((a, b) => getHeatScore(b) - getHeatScore(a));
  const trendingIds = new Set(sortedByHeat.slice(0, 3).map((post) => post.id));
  const coldIds = new Set(sortedByHeat.slice(-2).map((post) => post.id));
  const newCalls = [...posts]
    .filter((post) => !trendingIds.has(post.id) && !coldIds.has(post.id))
    .sort((a, b) => a.minutesAgo - b.minutesAgo);

  return [
    {
      id: "trending",
      title: "🔥 Trending",
      posts: sortedByHeat.filter((post) => trendingIds.has(post.id)),
    },
    {
      id: "new",
      title: "🆕 New Calls",
      posts: newCalls,
    },
    {
      id: "cold",
      title: "🧊 Cold Takes",
      posts: sortedByHeat.filter((post) => coldIds.has(post.id)).reverse(),
    },
  ];
}

export function getScore(post: Post) {
  const total = post.riders + post.faders;
  const recency = post.minutesAgo < 5 ? 1 : post.minutesAgo < 30 ? 0.8 : post.minutesAgo < 120 ? 0.6 : 0.2;
  const engagement = Math.log(total + 1) / Math.log(100);
  const conflict = total === 0 ? 0 : 1 - Math.abs(post.riders - post.faders) / total;

  let outcomeEnergy = 0;

  if (post.status === "won") outcomeEnergy = 0.7;
  if (post.status === "lost") outcomeEnergy = 0.9;
  if (post.status === "won" && post.isUnderdog) outcomeEnergy += 0.3;
  if (post.status === "lost" && post.riders > post.faders) outcomeEnergy += 0.25;
  if (post.justResolved) outcomeEnergy += 0.35;

  return recency * 0.35 + engagement * 0.25 + conflict * 0.2 + Math.min(outcomeEnergy, 1) * 0.15;
}

export function getBadge(post: Post) {
  if (post.status === "live") return "🟡 LIVE";
  if (post.status === "won") return "🟢 TALK BACKED UP";
  return "🔴 DIDN’T AGE WELL";
}

export function getRandomActivityMessage() {
  return activityMessages[Math.floor(Math.random() * activityMessages.length)];
}

export function getHeatScore(post: Post) {
  return post.heatScore ?? calculateHeatScore(post);
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
