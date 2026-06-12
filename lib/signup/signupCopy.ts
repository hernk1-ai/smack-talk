export type SignupPageCopy = {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  subheadline: string;
  formTitle: string;
  formSubtitle: string;
  submitLabel: string;
  formFooterNote: string;
  browseHelper: string;
  trustLine: string;
};

export function getSafeNextPath(nextPath?: string) {
  if (nextPath && nextPath.startsWith("/")) {
    return nextPath;
  }

  return "/app";
}

export function getSignupPageCopy(isClaimFlow: boolean): SignupPageCopy {
  if (isClaimFlow) {
    return {
      eyebrow: "Claim your Game Room name",
      headline: "Keep your calls",
      headlineAccent: "across devices.",
      subheadline: "Claim this Game Room name with email or Google so you can come back anytime.",
      formTitle: "Keep your Game Room name",
      formSubtitle: "Create a quick account so your calls and comments stay with you.",
      submitLabel: "Claim My Profile",
      formFooterNote: "Make calls, react live, and pick up from any device.",
      browseHelper: "You can still browse Match Hub and Schedule without an account.",
      trustLine: "13+ · No betting · No odds · No cash prizes",
    };
  }

  return {
    eyebrow: "Match Hub · Game Room",
    headline: "Watch the World Cup",
    headlineAccent: "with friends and family.",
    subheadline: "Game rooms for every match.",
    formTitle: "Save your Game Room spot",
    formSubtitle: "Create a quick account so your calls and comments stay with you.",
    submitLabel: "Continue to Match Hub",
    formFooterNote: "Make calls, react live, and come back from any device.",
    browseHelper: "You can still browse Match Hub and Schedule without an account.",
    trustLine: "13+ · No betting · No odds · No cash prizes",
  };
}
