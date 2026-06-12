export type RootingSide = "home" | "away";

export type RootingState = {
  homeCount: number;
  awayCount: number;
  choice: RootingSide | null;
  /** When the viewer last selected their side (ISO timestamp). */
  choiceAt: string | null;
};

export function emptyRootingState(): RootingState {
  return {
    homeCount: 0,
    awayCount: 0,
    choice: null,
    choiceAt: null,
  };
}
