/**
 * Normalize team names for ESPN ↔ Lockt schedule matching.
 * Produces a compact canonical key used for equality and substring checks.
 */
export function normalizeTeamName(value: string): string {
  const cleaned = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

  if (!cleaned) {
    return "";
  }

  return TEAM_CANONICAL[cleaned] ?? cleaned;
}

const TEAM_CANONICAL: Record<string, string> = {
  unitedstates: "unitedstates",
  usa: "unitedstates",
  usmnt: "unitedstates",
  bosniaandherzegovina: "bosniaandherzegovina",
  bosniaherzegovina: "bosniaandherzegovina",
  cotedivoire: "ivorycoast",
  ivorycoast: "ivorycoast",
  drcongo: "drcongo",
  congodr: "drcongo",
  democraticrepublicofcongo: "drcongo",
  czechia: "czechia",
  czechrepublic: "czechia",
  turkiye: "turkey",
  turkey: "turkey",
  curacao: "curacao",
  korearepublic: "southkorea",
  southkorea: "southkorea",
  republicofkorea: "southkorea",
  irislamicrepubliciran: "iran",
  iriran: "iran",
  iran: "iran",
};

/** Best-effort: do two team labels refer to the same side? */
export function teamsMatch(a: string, b: string): boolean {
  const left = normalizeTeamName(a);
  const right = normalizeTeamName(b);

  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  return left.includes(right) || right.includes(left);
}
