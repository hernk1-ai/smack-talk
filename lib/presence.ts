export type PresenceStatus = "online" | "away" | "offline";

export function getPresenceStatus(seed: string | null | undefined): PresenceStatus {
  const value = (seed ?? "").replace(/^@/, "").toLowerCase();

  if (!value) {
    return "offline";
  }

  const score = Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);
  const mod = score % 5;

  if (mod <= 1) {
    return "online";
  }

  if (mod <= 3) {
    return "away";
  }

  return "offline";
}

export function getPresenceMeta(status: PresenceStatus) {
  if (status === "online") {
    return {
      label: "Online",
      className: "bg-lime-400 shadow-[0_0_12px_rgba(132,204,22,0.75)]",
      textClassName: "text-lime-300",
    };
  }

  if (status === "away") {
    return {
      label: "Away",
      className: "bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]",
      textClassName: "text-purple-300",
    };
  }

  return {
    label: "Offline",
    className: "bg-gray-600",
    textClassName: "text-gray-500",
  };
}
