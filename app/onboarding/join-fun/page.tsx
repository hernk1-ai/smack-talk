import { redirect } from "next/navigation";

import { LEGACY_ONBOARDING_REDIRECT } from "@/lib/routing/legacyOnboarding";

export default function JoinFunOnboardingPage() {
  redirect(LEGACY_ONBOARDING_REDIRECT);
}
