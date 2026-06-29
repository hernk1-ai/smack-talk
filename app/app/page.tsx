import type { Metadata } from "next";

import { LocktApp } from "@/components/LocktApp";
import { SITEMAP_BASE_URL } from "@/lib/seo/sitemap";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/profiles";
import { fetchResolvedMatchContextInput } from "@/lib/worldCup/fetchResolvedMatchContext";

const APP_URL = `${SITEMAP_BASE_URL}/app`;
const APP_TITLE = "Lockt Match Hub | Watch the World Cup With Friends and Family";
const APP_DESCRIPTION =
  "Follow live World Cup matches, root for your team, join Game Rooms, and watch with friends and family on Lockt.";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: "LOCKT",
    type: "website",
  },
};

export default async function AppPage() {
  const matchContext = await fetchResolvedMatchContextInput();
  const supabase = await createClient();

  if (!supabase) {
    return <LocktApp matchContext={matchContext} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LocktApp matchContext={matchContext} />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <LocktApp profile={profile} matchContext={matchContext} />;
}
