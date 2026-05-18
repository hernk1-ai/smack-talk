const SOUND_MUTED_KEY = "lockt:sound-muted";
const IN_APP_NOTIFICATIONS_KEY = "lockt:in-app-notifications";

export function getSoundMutedPreference() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_MUTED_KEY) === "1";
}

export function setSoundMutedPreference(muted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_MUTED_KEY, muted ? "1" : "0");
}

export function getInAppNotificationsEnabled() {
  if (typeof window === "undefined") return true;
  const value = window.localStorage.getItem(IN_APP_NOTIFICATIONS_KEY);
  return value !== "0";
}

export function setInAppNotificationsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, enabled ? "1" : "0");
}
