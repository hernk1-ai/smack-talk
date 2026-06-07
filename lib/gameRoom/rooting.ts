export type RootingSide = "home" | "away";

export type RootingState = {
  homeCount: number;
  awayCount: number;
  choice: RootingSide | null;
};

export function emptyRootingState(): RootingState {
  return {
    homeCount: 0,
    awayCount: 0,
    choice: null,
  };
}
