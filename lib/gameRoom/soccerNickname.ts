import { getOrCreateVoterKey } from "@/lib/gameRoom/voterKey";

const SOCCER_NICKNAME_STORAGE = "lockt-soccer-nickname";

const SOCCER_NICKNAMES = [
  "SoccerStar",
  "MrBoots",
  "Ballhog",
  "GoalHopper",
  "PitchKing",
  "Striker99",
  "CleatCheck",
  "HeaderHero",
  "MidMaestro",
  "NetRipper",
  "TouchlineT",
  "PanenkaPro",
  "NutmegNinja",
  "CornerFlag",
  "Supersub",
  "CleanSheet",
  "GoldenBoot",
  "PitchSide",
  "UltrasMode",
  "MatchdayMax",
  "ExtraTime",
  "TapInKing",
  "LongBallLou",
  "PressMaster",
  "FalseNine",
  "WingWizard",
  "StopperSam",
  "GoldGlove",
  "BootRoom",
  "AwayDayAl",
  "TopBins",
  "ThroughBall",
  "SetPiece",
  "WallJump",
  "PitchRat",
  "BootScuff",
  "GrassStain",
  "FinalWhistle",
  "DerbyDay",
  "WorldCupFan",
] as const;

function hashVoterKey(voterKey: string) {
  let hash = 0;
  for (let i = 0; i < voterKey.length; i += 1) {
    hash = (hash * 31 + voterKey.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickSoccerNickname(voterKey: string) {
  const index = hashVoterKey(voterKey) % SOCCER_NICKNAMES.length;
  return SOCCER_NICKNAMES[index] ?? "SoccerStar";
}

export function getOrAssignSoccerNickname() {
  if (typeof window === "undefined") {
    return "SoccerStar";
  }

  const stored = window.localStorage.getItem(SOCCER_NICKNAME_STORAGE)?.trim();
  if (stored) {
    return stored.slice(0, 20);
  }

  const voterKey = getOrCreateVoterKey();
  const nickname = voterKey ? pickSoccerNickname(voterKey) : "SoccerStar";
  window.localStorage.setItem(SOCCER_NICKNAME_STORAGE, nickname);
  return nickname;
}
