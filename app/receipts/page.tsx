import type { Metadata } from "next";

import { SmackTalkApp } from "@/components/SmackTalkApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smacktalk.app";

export const metadata: Metadata = {
  title: "Smack Talk Receipts",
  description: "Public takes. Permanent receipts. The Arena remembers.",
  openGraph: {
    title: "Smack Talk Receipts",
    description: "Public takes. Permanent receipts. The Arena remembers.",
    url: `${BASE_URL}/receipts`,
    type: "website",
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
