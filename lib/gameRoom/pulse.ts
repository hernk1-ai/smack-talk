export type PulseItemType = "presence" | "chat" | "support" | "moment";

export type PulseItem = {
  type: PulseItemType;
  emoji: string;
  text: string;
  priority: number;
};

export type GameRoomPulseResponse = {
  gameId: string;
  generatedAt: string;
  items: PulseItem[];
};

export const PULSE_PRESENCE_WINDOW_MS = 10 * 60 * 1000;
export const PULSE_CHAT_WINDOW_MS = 15 * 60 * 1000;
/** Recent backing changes; swing snapshots can extend this later. */
export const PULSE_SUPPORT_RECENT_WINDOW_MS = 15 * 60 * 1000;
export const PULSE_MAX_ITEMS = 3;
