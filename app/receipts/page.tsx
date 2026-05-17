import type { Metadata } from "next";

import { LocktApp } from "@/components/LocktApp";
import { getSiteUrl } from "@/lib/site-url";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: "LOCKT Receipts",
  description: "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.",
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
    return <LocktApp initialView="receipts" />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LocktApp initialView="receipts" />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <LocktApp profile={profile} initialView="receipts" />;
}
