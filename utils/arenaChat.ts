export type ArenaMessageType = "normal" | "locked_call" | "system_moment" | "callout";

export type ArenaReactionKey = "fire" | "devil" | "clown" | "brain";

export type ArenaReactionCounts = Record<ArenaReactionKey, number>;

export type ArenaMessage = {
  id: string;
  handle: string;
  badge: string;
  message: string;
  timestamp: string;
  type: ArenaMessageType;
  actionLabel?: string;
};

export type CookingUser = {
  rank: number;
  handle: string;
  points: number;
  icon: string;
};

export const arenaReactionLabels: Record<ArenaReactionKey, string> = {
  fire: "🔥",
  devil: "😈",
  clown: "🤡",
  brain: "🧠",
};

export const defaultArenaReactionCounts: ArenaReactionCounts = {
  fire: 0,
  devil: 0,
  clown: 0,
  brain: 0,
};

export const mockArenaMessages: ArenaMessage[] = [
  {
    id: "msg-1",
    handle: "@FadeKing",
    badge: "Problem",
    message: "GSW doesn’t have legs bro 😂",
    timestamp: "3:42",
    type: "normal",
  },
  {
    id: "msg-2",
    handle: "@BucketsOnly",
    badge: "Certified",
    message: "Lakers heating up. Watch this run.",
    timestamp: "3:37",
    type: "normal",
  },
  {
    id: "msg-3",
    handle: "@IceColdTake",
    badge: "Sharp",
    message: "Everyone riding LAL… I’m fading.",
    timestamp: "3:31",
    type: "locked_call",
    actionLabel: "Faded GSW",
  },
  {
    id: "msg-4",
    handle: "Arena",
    badge: "System",
    message: "🏀 8–0 RUN (LAL)",
    timestamp: "3:24",
    type: "system_moment",
  },
  {
    id: "msg-5",
    handle: "@NoJumper",
    badge: "Rookie",
    message: "This arena is about to explode.",
    timestamp: "3:18",
    type: "normal",
  },
  {
    id: "msg-6",
    handle: "Arena",
    badge: "System",
    message: "🔥 12 users called this",
    timestamp: "3:12",
    type: "system_moment",
  },
  {
    id: "msg-7",
    handle: "@CourtVision",
    badge: "Problem",
    message: "Public is way too confident.",
    timestamp: "3:07",
    type: "normal",
  },
  {
    id: "msg-8",
    handle: "@hernk1",
    badge: "You",
    message: "No switching sides.",
    timestamp: "3:01",
    type: "locked_call",
    actionLabel: "Rode LAL",
  },
];

export const topArenaTakes = [
  {
    handle: "@FadeKing",
    text: "GSW late push. Crowd is loud, but the legs are coming back.",
    action: "Fade GSW",
    tone: "fade",
  },
  {
    handle: "@BucketsOnly",
    text: "LAL closes this out. Too much paint pressure.",
    action: "Ride LAL",
    tone: "ride",
  },
  {
    handle: "@IceColdTake",
    text: "One empty trip each and we are stuck right here.",
    action: "Draw",
    tone: "draw",
  },
] as const;

export const whoIsCookingUsers: CookingUser[] = [
  { rank: 1, handle: "FadeKing", points: 180, icon: "😈" },
  { rank: 2, handle: "BucketsOnly", points: 150, icon: "🔥" },
  { rank: 3, handle: "IceColdTake", points: 120, icon: "🧠" },
];

export function createCalloutMessage(targetHandle: string): ArenaMessage {
  return {
    id: `callout-${Date.now()}`,
    handle: "Arena",
    badge: "Callout",
    message: `😈 ${targetHandle} got called out. Back that take up.`,
    timestamp: "now",
    type: "callout",
  };
}

export function createLockedCallMessage(actionLabel: "Rode LAL" | "Faded GSW"): ArenaMessage {
  return {
    id: `locked-${Date.now()}`,
    handle: "@hernk1",
    badge: "You",
    message: "No switching sides.",
    timestamp: "now",
    type: "locked_call",
    actionLabel,
  };
}
