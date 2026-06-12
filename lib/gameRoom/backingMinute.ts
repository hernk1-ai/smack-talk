/** Display label for when a user backed a team relative to kickoff. */
export function formatBackingJoinMinute(kickoffIso: string, joinedAt: string): string {
  const kickoffMs = new Date(kickoffIso).getTime();
  const joinedMs = new Date(joinedAt).getTime();

  if (!Number.isFinite(kickoffMs) || !Number.isFinite(joinedMs)) {
    return "";
  }

  const elapsedMin = Math.floor((joinedMs - kickoffMs) / 60000);

  if (elapsedMin < 0) {
    return "before kickoff";
  }
  if (elapsedMin < 45) {
    return `the ${elapsedMin + 1}'`;
  }
  if (elapsedMin < 60) {
    return "halftime";
  }
  if (elapsedMin < 105) {
    return `the ${elapsedMin - 14}'`;
  }
  if (elapsedMin < 180) {
    return "the late stages";
  }

  return "after full time";
}
