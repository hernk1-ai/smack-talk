export type AvatarKey = "logo" | "soccer" | "trophy";

export type AvatarOption = {
  key: AvatarKey;
  label: string;
  glyph: string;
  tone: "green" | "purple";
};

export const AVATAR_PREFIX = "smack-avatar:";

export const avatarOptions: AvatarOption[] = [
  { key: "logo", label: "Lockt Logo", glyph: "L", tone: "green" },
  { key: "soccer", label: "Soccer Ball", glyph: "⚽", tone: "green" },
  { key: "trophy", label: "Trophy", glyph: "🏆", tone: "purple" },
];

export function serializeAvatarKey(key: AvatarKey) {
  return `${AVATAR_PREFIX}${key}`;
}

export function isStoredAvatarKey(value?: string | null) {
  return Boolean(value?.startsWith(AVATAR_PREFIX));
}

export function normalizeAvatarKey(value?: string | null): AvatarKey {
  const rawKey = value?.startsWith(AVATAR_PREFIX) ? value.slice(AVATAR_PREFIX.length) : value;
  const legacyMap: Record<string, AvatarKey> = {
    lightning: "soccer",
    skull: "trophy",
    hood: "logo",
    crown: "trophy",
    target: "soccer",
  };
  const normalizedRawKey = rawKey && legacyMap[rawKey] ? legacyMap[rawKey] : rawKey;
  const match = avatarOptions.find((option) => option.key === normalizedRawKey);

  return match?.key ?? "logo";
}

export function getAvatarOption(value?: string | null) {
  const key = normalizeAvatarKey(value);
  return avatarOptions.find((option) => option.key === key) ?? avatarOptions[0];
}

export function isImageAvatar(value?: string | null) {
  return Boolean(value && !isStoredAvatarKey(value));
}
