import type { Metadata } from "next";

import { SmackTalkApp } from "@/components/SmackTalkApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smacktalk.app";

export const metadata: Metadata = {
  title: "LOCKT Receipts",
  description: "Public takes. Permanent receipts. The Arena remembers.",
  alternates: {
    canonical: `${BASE_URL}/receipts`,
  },
  openGraph: {
    title: "LOCKT Receipts",
    description: "Public takes. Permanent receipts. The Arena remembers.",
    url: `${BASE_URL}/receipts`,
    siteName: "LOCKT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOCKT Receipts",
    description: "Public takes. Permanent receipts. The Arena remembers.",
  },
};

export default async function ReceiptsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <SmackTalkApp initialView="receipts" />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SmackTalkApp initialView="receipts" />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <SmackTalkApp profile={profile} initialView="receipts" />;
}
