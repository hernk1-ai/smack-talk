export type SeededProfile = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  title: string;
  reputation_score: number;
  created_takes_count: number;
  heat: number;
  wins: number;
  losses: number;
  hit_rate: number;
  viral: number;
  streak: number;
  favoriteTeams: string[];
  isSeeded: true;
};

export type SeededTake = {
  id: string;
  userId: string;
  gameId: string;
  takeText: string;
  ride_count: number;
  fade_count: number;
  reply_count: number;
  heat: number;
  created_at: string;
  status: "locked";
  result: "pending";
  isSeeded: true;
};

export type SeededReply = {
  id: string;
  takeId: string;
  userId: string;
  replyText: string;
  created_at: string;
  parentReplyId?: string | null;
  isSeeded: true;
};

export type SeededReceipt = {
  id: string;
  userId: string;
  takeText: string;
  result: "hit" | "miss";
  gameLabel: string;
  finalScore: string;
  ride_count: number;
  fade_count: number;
  reply_count: number;
  heat: number;
  reputation_delta: number;
  created_at: string;
  isSeeded: true;
};

export const SEEDED_GAME_ID = "wc-usa-par-live";

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60_000).toISOString();

export const seededProfiles: SeededProfile[] = [
  {
    id: "seeded_user_talkheavy23",
    username: "TalkHeavy23",
    displayName: "Talk Heavy",
    avatar: "TH",
    title: "Top Talker",
    reputation_score: 28600,
    created_takes_count: 142,
    heat: 28600,
    wins: 142,
    losses: 64,
    hit_rate: 69,
    viral: 24,
    streak: 12,
    favoriteTeams: ["USA", "MEX", "ARG"],
    isSeeded: true,
  },
  {
    id: "seeded_user_midrange",
    username: "MidRange",
    displayName: "Mid Range",
    avatar: "MR",
    title: "Shot Caller",
    reputation_score: 22400,
    created_takes_count: 118,
    heat: 22400,
    wins: 118,
    losses: 61,
    hit_rate: 66,
    viral: 18,
    streak: 8,
    favoriteTeams: ["FRA", "ESP", "NED"],
    isSeeded: true,
  },
  {
    id: "seeded_user_bucketsonly",
    username: "BucketsOnly",
    displayName: "Buckets Only",
    avatar: "BO",
    title: "Buckets Only",
    reputation_score: 20100,
    created_takes_count: 112,
    heat: 20100,
    wins: 112,
    losses: 63,
    hit_rate: 64,
    viral: 16,
    streak: 7,
    favoriteTeams: ["BRA", "POR", "ENG"],
    isSeeded: true,
  },
  {
    id: "seeded_user_fadeking",
    username: "FadeKing",
    displayName: "Fade King",
    avatar: "FK",
    title: "Fade God",
    reputation_score: 16900,
    created_takes_count: 93,
    heat: 16900,
    wins: 93,
    losses: 59,
    hit_rate: 61,
    viral: 22,
    streak: 6,
    favoriteTeams: ["GER", "USA", "FRA"],
    isSeeded: true,
  },
  {
    id: "seeded_user_hoopdreams",
    username: "HoopDreams",
    displayName: "Hoop Dreams",
    avatar: "HD",
    title: "Crowd Rider",
    reputation_score: 18700,
    created_takes_count: 98,
    heat: 18700,
    wins: 98,
    losses: 58,
    hit_rate: 63,
    viral: 14,
    streak: 9,
    favoriteTeams: ["CAN", "MEX", "NED"],
    isSeeded: true,
  },
  {
    id: "seeded_user_nomercy",
    username: "NoMercy",
    displayName: "No Mercy",
    avatar: "NM",
    title: "No Mercy",
    reputation_score: 15200,
    created_takes_count: 87,
    heat: 15200,
    wins: 87,
    losses: 53,
    hit_rate: 62,
    viral: 11,
    streak: 5,
    favoriteTeams: ["BRA", "ARG", "ESP"],
    isSeeded: true,
  },
  {
    id: "seeded_user_primetalker",
    username: "PrimeTalker",
    displayName: "Prime Talker",
    avatar: "PT",
    title: "Prime Time",
    reputation_score: 13800,
    created_takes_count: 79,
    heat: 13800,
    wins: 79,
    losses: 53,
    hit_rate: 60,
    viral: 9,
    streak: 4,
    favoriteTeams: ["ENG", "GER", "USA"],
    isSeeded: true,
  },
  {
    id: "seeded_user_clutchcallz",
    username: "ClutchCallz",
    displayName: "Clutch Callz",
    avatar: "CC",
    title: "Clutch Calls Only",
    reputation_score: 12100,
    created_takes_count: 71,
    heat: 12100,
    wins: 71,
    losses: 49,
    hit_rate: 59,
    viral: 8,
    streak: 4,
    favoriteTeams: ["POR", "FRA", "MEX"],
    isSeeded: true,
  },
  {
    id: "seeded_user_realdeal",
    username: "RealDeal",
    displayName: "Real Deal",
    avatar: "RD",
    title: "Straight Shooter",
    reputation_score: 11200,
    created_takes_count: 66,
    heat: 11200,
    wins: 66,
    losses: 48,
    hit_rate: 58,
    viral: 7,
    streak: 3,
    favoriteTeams: ["NED", "ESP", "CAN"],
    isSeeded: true,
  },
  {
    id: "seeded_user_sharpmind",
    username: "SharpMind",
    displayName: "Sharp Mind",
    avatar: "SM",
    title: "Numbers Don't Lie",
    reputation_score: 13600,
    created_takes_count: 63,
    heat: 13600,
    wins: 63,
    losses: 47,
    hit_rate: 57,
    viral: 6,
    streak: 3,
    favoriteTeams: ["ARG", "BRA", "ENG"],
    isSeeded: true,
  },
];

export const seededTakes: SeededTake[] = [
  {
    id: "seeded_take_curry_choking",
    userId: "seeded_user_talkheavy23",
    gameId: SEEDED_GAME_ID,
    takeText: "USA gets the opener done.",
    ride_count: 1300,
    fade_count: 342,
    reply_count: 18,
    heat: 1678,
    created_at: minutesAgo(2),
    status: "locked",
    result: "pending",
    isSeeded: true,
  },
  {
    id: "seeded_take_mexico_first_goal",
    userId: "seeded_user_bucketsonly",
    gameId: SEEDED_GAME_ID,
    takeText: "Mexico scores first.",
    ride_count: 984,
    fade_count: 509,
    reply_count: 12,
    heat: 1517,
    created_at: minutesAgo(4),
    status: "locked",
    result: "pending",
    isSeeded: true,
  },
  {
    id: "seeded_take_paraguay_upset",
    userId: "seeded_user_fadeking",
    gameId: SEEDED_GAME_ID,
    takeText: "Paraguay can steal this.",
    ride_count: 621,
    fade_count: 812,
    reply_count: 15,
    heat: 1463,
    created_at: minutesAgo(6),
    status: "locked",
    result: "pending",
    isSeeded: true,
  },
  {
    id: "seeded_take_france_group",
    userId: "seeded_user_midrange",
    gameId: SEEDED_GAME_ID,
    takeText: "France tops their group.",
    ride_count: 842,
    fade_count: 193,
    reply_count: 9,
    heat: 1053,
    created_at: minutesAgo(8),
    status: "locked",
    result: "pending",
    isSeeded: true,
  },
  {
    id: "seeded_take_fade_crowd",
    userId: "seeded_user_nomercy",
    gameId: SEEDED_GAME_ID,
    takeText: "Fade the crowd before kickoff.",
    ride_count: 487,
    fade_count: 714,
    reply_count: 11,
    heat: 1223,
    created_at: minutesAgo(11),
    status: "locked",
    result: "pending",
    isSeeded: true,
  },
  {
    id: "seeded_take_upset_waiting",
    userId: "seeded_user_hoopdreams",
    gameId: SEEDED_GAME_ID,
    takeText: "Upset alert in this group stage match.",
    ride_count: 621,
    fade_count: 168,
    reply_count: 7,
    heat: 803,
    created_at: minutesAgo(14),
    status: "locked",
    result: "pending",
    isSeeded: true,
  },
];

export const seededReplies: SeededReply[] = [
  { id: "seeded_reply_1", takeId: "seeded_take_curry_choking", userId: "seeded_user_fadeking", replyText: "Called it if USA scores early.", created_at: minutesAgo(1), isSeeded: true },
  { id: "seeded_reply_2", takeId: "seeded_take_curry_choking", userId: "seeded_user_midrange", replyText: "Check the receipt after full time.", created_at: minutesAgo(1), isSeeded: true },
  { id: "seeded_reply_3", takeId: "seeded_take_mexico_first_goal", userId: "seeded_user_hoopdreams", replyText: "Public is too heavy on this side.", created_at: minutesAgo(3), isSeeded: true },
  { id: "seeded_reply_4", takeId: "seeded_take_paraguay_upset", userId: "seeded_user_bucketsonly", replyText: "Got it locked before kickoff.", created_at: minutesAgo(5), isSeeded: true },
  { id: "seeded_reply_5", takeId: "seeded_take_fade_crowd", userId: "seeded_user_sharpmind", replyText: "Group stage gets wild fast.", created_at: minutesAgo(9), isSeeded: true },
];

export const seededReceipts: SeededReceipt[] = [
  { id: "seeded_receipt_1", userId: "seeded_user_talkheavy23", takeText: "USA gets the opener done.", result: "hit", gameLabel: "World Cup Group Stage", finalScore: "USA 2 / PAR 1", ride_count: 1300, fade_count: 342, reply_count: 18, heat: 1678, reputation_delta: 35, created_at: hoursAgo(2), isSeeded: true },
  { id: "seeded_receipt_2", userId: "seeded_user_midrange", takeText: "Mexico scores first.", result: "hit", gameLabel: "World Cup Group Stage", finalScore: "MEX 1 / RSA 0", ride_count: 1000, fade_count: 276, reply_count: 14, heat: 1304, reputation_delta: 35, created_at: hoursAgo(8), isSeeded: true },
  { id: "seeded_receipt_3", userId: "seeded_user_fadeking", takeText: "France tops their group.", result: "hit", gameLabel: "World Cup Group Stage", finalScore: "FRA 3 / NED 1", ride_count: 842, fade_count: 193, reply_count: 9, heat: 1053, reputation_delta: 35, created_at: hoursAgo(18), isSeeded: true },
  { id: "seeded_receipt_4", userId: "seeded_user_bucketsonly", takeText: "Paraguay can steal this.", result: "miss", gameLabel: "World Cup Group Stage", finalScore: "USA 2 / PAR 1", ride_count: 984, fade_count: 509, reply_count: 12, heat: 1517, reputation_delta: -10, created_at: hoursAgo(28), isSeeded: true },
];

export const seededChaosAlerts = [
  { id: "seeded_alert_ride-heavy", icon: "◎", title: "94% riding Team Alpha.", detail: "Fade side is waking up.", time: "2m ago", tone: "green" as const },
  { id: "seeded_alert_collapse", icon: "▲", title: "Game flipped fast.", detail: "Late run changed the board.", time: "4m ago", tone: "green" as const },
  { id: "seeded_alert_pressure", icon: "ϟ", title: "Crowd split on this one.", detail: "Ride and fade are neck and neck.", time: "5m ago", tone: "purple" as const },
  { id: "seeded_alert_buckets", icon: "♜", title: "BucketsOnly just hit again.", detail: "3 for 3 today.", time: "6m ago", tone: "purple" as const },
  { id: "seeded_alert_toxic", icon: "☠", title: "Thread getting heated.", detail: "Plenty of takes flying right now.", time: "8m ago", tone: "red" as const },
  { id: "seeded_alert_sharp", icon: "↗", title: "Crowd leaning fade on Omega.", detail: "Momentum moved in a hurry.", time: "11m ago", tone: "green" as const },
];

export function isSeededId(id: string) {
  return id.startsWith("seeded_");
}

export function getSeededProfileById(id: string) {
  return seededProfiles.find((profile) => profile.id === id) ?? null;
}

export function getSeededProfileByUsername(username: string) {
  const key = username.replace(/^@/, "").toLowerCase();
  return seededProfiles.find((profile) => profile.username.toLowerCase() === key) ?? null;
}

export function getSeededTakeById(takeId: string) {
  return seededTakes.find((take) => take.id === takeId) ?? null;
}

export function getSeededTakesByGame(gameId: string) {
  return seededTakes.filter((take) => take.gameId === gameId);
}

export function getSeededRepliesForTake(takeId: string) {
  return seededReplies.filter((reply) => reply.takeId === takeId);
}

export function getSeededReceiptsByUsername(username: string) {
  const profile = getSeededProfileByUsername(username);
  return profile ? seededReceipts.filter((receipt) => receipt.userId === profile.id) : [];
}

export function getSeededReceiptById(receiptId: string) {
  const normalizedId = receiptId.replace(/_viral$/, "");
  return seededReceipts.find((receipt) => receipt.id === normalizedId) ?? null;
}
