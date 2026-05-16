export type PresenceStatus = "live" | "online" | "away" | "offline";

export function getPresenceStatus(seed: string | null | undefined, lastActiveAt?: string | null): PresenceStatus {
  if (lastActiveAt) {
    const ageMinutes = Math.max(0, Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60000));

    if (ageMinutes <= 8) {
      return "live";
    }

    if (ageMinutes <= 180) {
      return "online";
    }

    if (ageMinutes <= 1440) {
      return "away";
    }

    return "offline";
  }

  const value = (seed ?? "").replace(/^@/, "").toLowerCase();

  if (!value) {
    return "offline";
  }

  const score = Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);
  const mod = score % 8;

  if (mod <= 1) {
    return "live";
  }

  if (mod <= 3) {
    return "online";
  }

  if (mod <= 5) {
    return "away";
  }

  return "offline";
}

export function getPresenceMeta(status: PresenceStatus) {
  if (status === "live") {
    return {
      label: "LIVE",
      className: "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.8)] animate-pulse",
      textClassName: "text-red-300",
    };
  }

  if (status === "online") {
    return {
      label: "ONLINE",
      className: "bg-lime-400 shadow-[0_0_12px_rgba(132,204,22,0.75)]",
      textClassName: "text-lime-300",
    };
  }

  if (status === "away") {
    return {
      label: "AWAY",
      className: "bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]",
      textClassName: "text-purple-300",
    };
  }

  return {
    label: "OFFLINE",
    className: "bg-gray-600",
    textClassName: "text-gray-500",
  };
}
