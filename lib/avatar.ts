export type AvatarKey = "logo" | "lightning" | "skull" | "hood" | "crown" | "target";

export type AvatarOption = {
  key: AvatarKey;
  label: string;
  glyph: string;
  tone: "green" | "purple";
};

export const AVATAR_PREFIX = "smack-avatar:";

export const avatarOptions: AvatarOption[] = [
  { key: "logo", label: "LOCKT", glyph: "ST", tone: "green" },
  { key: "lightning", label: "Lightning", glyph: "ϟ", tone: "green" },
  { key: "skull", label: "Receipt King", glyph: "☠", tone: "purple" },
  { key: "hood", label: "Hooded", glyph: "◒", tone: "purple" },
  { key: "crown", label: "Top Talker", glyph: "♕", tone: "green" },
  { key: "target", label: "Sharp Mind", glyph: "◎", tone: "purple" },
];

export function serializeAvatarKey(key: AvatarKey) {
  return `${AVATAR_PREFIX}${key}`;
}

export function isStoredAvatarKey(value?: string | null) {
  return Boolean(value?.startsWith(AVATAR_PREFIX));
}

export function normalizeAvatarKey(value?: string | null): AvatarKey {
  const rawKey = value?.startsWith(AVATAR_PREFIX) ? value.slice(AVATAR_PREFIX.length) : value;
  const match = avatarOptions.find((option) => option.key === rawKey);

  return match?.key ?? "logo";
}

export function getAvatarOption(value?: string | null) {
  const key = normalizeAvatarKey(value);
  return avatarOptions.find((option) => option.key === key) ?? avatarOptions[0];
}

export function isImageAvatar(value?: string | null) {
  return Boolean(value && !isStoredAvatarKey(value));
}
