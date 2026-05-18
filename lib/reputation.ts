export type ReputationStats = {
  reputation: number;
  wins: number;
  losses: number;
  takes: number;
  receipts: number;
  streak: number;
  heat?: number;
  rideCount?: number;
  fadeCount?: number;
  replyCount?: number;
  rank?: number;
};

export type ReputationLevel = {
  title: string;
  level: number;
  minRep: number;
  nextTitle?: string;
  nextRep?: number;
};

export type ReputationBadge = {
  name: string;
  subtitle: string;
  icon: string;
  tone: "green" | "purple" | "blue" | "red" | "teal";
  earned: boolean;
};

export type HeatStatus = {
  label: string;
  detail: string;
  tone: "green" | "purple" | "red" | "gray";
};

export function getReputationLevel(reputation: number, activityCount = 0): ReputationLevel {
  const hasFirstLock = activityCount > 0 || reputation > 0;
  if (hasFirstLock) {
    return {
      title: "Player",
      level: 2,
      minRep: 25,
      nextTitle: undefined,
      nextRep: undefined,
    };
  }

  return {
    title: "Rookie",
    level: 1,
    minRep: 0,
    nextTitle: "Player",
    nextRep: 25,
  };
}

export function getCurrentWinStreak(results: Array<{ result: "hit" | "miss" | "pending" | string }>) {
  let streak = 0;

  for (const item of results) {
    if (item.result !== "hit") {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function getBestWinStreak(results: Array<{ result: "hit" | "miss" | "pending" | string }>) {
  let best = 0;
  let current = 0;

  for (const item of results) {
    if (item.result === "hit") {
      current += 1;
      best = Math.max(best, current);
    } else if (item.result === "miss") {
      current = 0;
    }
  }

  return best;
}

export function getHitRate(wins: number, losses: number) {
  const total = wins + losses;
  return total ? Math.round((wins / total) * 100) : 0;
}

export function getHeatStatus({
  heat = 0,
  reputation = 0,
  streak = 0,
  result,
}: {
  heat?: number;
  reputation?: number;
  streak?: number;
  result?: "hit" | "miss" | "pending" | string;
}): HeatStatus {
  if (result === "miss") {
    return { label: "Exposed", detail: "The receipt hit back.", tone: "red" };
  }

  if (streak >= 3 || heat >= 2500 || reputation >= 12000) {
    return { label: "On Fire", detail: "The Crowd is watching.", tone: "green" };
  }

  if (heat >= 250 || reputation >= 2500) {
    return { label: "Heating Up", detail: "Momentum is building.", tone: "purple" };
  }

  return { label: "Live", detail: "Pressure is forming.", tone: "gray" };
}

export function getCrowdPressure({
  rideCount = 0,
  fadeCount = 0,
  heat = 0,
  replyCount = 0,
}: {
  rideCount?: number;
  fadeCount?: number;
  heat?: number;
  replyCount?: number;
}) {
  const total = rideCount + fadeCount;
  const ridePercent = total ? Math.round((rideCount / total) * 100) : 50;
  const fadePercent = total ? 100 - ridePercent : 50;
  const leader = ridePercent >= fadePercent ? "Ride" : "Fade";
  const spread = Math.abs(ridePercent - fadePercent);
  const label = spread <= 12 ? "Arena Split" : leader === "Ride" ? "Crowd Riding" : "Fade Wave";
  const detail =
    heat >= 1000 || replyCount >= 10
      ? "Heat rising fast"
      : spread <= 12
        ? "Nobody owns this yet"
        : `${Math.max(ridePercent, fadePercent)}% leaning ${leader}`;

  return {
    label,
    detail,
    ridePercent,
    fadePercent,
    tone: leader === "Ride" ? "green" as const : "purple" as const,
  };
}

export function getReputationBadges(stats: ReputationStats): ReputationBadge[] {
  const hitRate = getHitRate(stats.wins, stats.losses);
  const totalReactions = (stats.rideCount ?? 0) + (stats.fadeCount ?? 0);
  const heat = stats.heat ?? stats.reputation;

  return [
    {
      name: "Receipt King",
      subtitle: stats.wins >= 5 ? `${stats.wins} wins held` : "5 wins",
      icon: "▰",
      tone: "purple",
      earned: stats.wins >= 5 || stats.receipts >= 5,
    },
    {
      name: "Viral King",
      subtitle: heat >= 2500 ? `${formatBadgeNumber(heat)} heat` : "2.5K heat",
      icon: "ϟ",
      tone: "blue",
      earned: heat >= 2500,
    },
    {
      name: "Sharp Shooter",
      subtitle: hitRate >= 80 ? `${hitRate}% hit rate` : "80% hit rate",
      icon: "◎",
      tone: "red",
      earned: stats.receipts >= 3 && hitRate >= 80,
    },
    {
      name: "Crowd Rider",
      subtitle: totalReactions >= 1000 ? "Crowd moved" : "1K reactions",
      icon: "◉",
      tone: "teal",
      earned: totalReactions >= 1000 || heat >= 1000,
    },
    {
      name: "Fade Master",
      subtitle: (stats.fadeCount ?? 0) >= 500 ? "Fades received" : "500 fades",
      icon: "⌁",
      tone: "purple",
      earned: (stats.fadeCount ?? 0) >= 500,
    },
    {
      name: "Heat Seeker",
      subtitle: stats.takes > 0 ? "First lock live" : "Lock a take",
      icon: "🔥",
      tone: "green",
      earned: stats.takes > 0 || heat >= 25,
    },
    {
      name: "Top Talker",
      subtitle: stats.rank && stats.rank <= 10 ? `Rank #${stats.rank}` : "Top 10",
      icon: "♕",
      tone: "green",
      earned: stats.reputation >= 12000 || Boolean(stats.rank && stats.rank <= 10),
    },
    {
      name: "Streak King",
      subtitle: stats.streak >= 3 ? `${stats.streak}W streak` : "3W streak",
      icon: "☇",
      tone: "purple",
      earned: stats.streak >= 3,
    },
  ];
}

export function getActivityAlerts(stats: ReputationStats, badges: ReputationBadge[]) {
  const earnedBadges = badges.filter((badge) => badge.earned);
  const hitRate = getHitRate(stats.wins, stats.losses);
  const alerts: string[] = [];

  if (earnedBadges[0]) {
    alerts.push(`Trophy unlocked: ${earnedBadges[0].name}`);
  }

  if (stats.streak >= 3) {
    alerts.push(`${stats.streak} straight receipts held`);
  }

  if ((stats.heat ?? 0) >= 1000) {
    alerts.push("Your record is heating up");
  }

  if (hitRate >= 70 && stats.receipts >= 3) {
    alerts.push(`${hitRate}% hit rate has the Crowd watching`);
  }

  if (!alerts.length) {
    alerts.push("Lock a take to start moving your REP");
  }

  return alerts.slice(0, 3);
}

function formatBadgeNumber(value: number) {
  if (value >= 1000) {
    return `${Number((value / 1000).toFixed(1))}K`;
  }

  return String(value);
}
