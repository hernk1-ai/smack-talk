export function formatMatchupLabel(homeTeam: string, awayTeam: string): string {
  return `${homeTeam} vs ${awayTeam}`;
}

export function formatMatchupScoreLine(
  homeTeam: string,
  homeScore: number | string,
  awayTeam: string,
  awayScore: number | string,
): string {
  return `${homeTeam} ${homeScore} — ${awayScore} ${awayTeam}`;
}

export function formatMatchupScoreCompact(homeScore: number | string, awayScore: number | string): string {
  return `${homeScore} - ${awayScore}`;
}
