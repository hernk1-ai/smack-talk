const VOTER_KEY_STORAGE = "lockt-voter-key";

export function getOrCreateVoterKey() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(VOTER_KEY_STORAGE)?.trim();
  if (existing) {
    return existing;
  }

  const nextKey = crypto.randomUUID();
  window.localStorage.setItem(VOTER_KEY_STORAGE, nextKey);
  return nextKey;
}
