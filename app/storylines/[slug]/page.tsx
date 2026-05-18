import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorylineDetailPage } from "@/components/storylines/StorylineDetailPage";
import { getStorylineBySlug } from "@/data/worldCupStorylines";
import { getSiteUrl } from "@/lib/site-url";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const storyline = getStorylineBySlug(slug);

  if (!storyline) {
    return {
      title: "Storyline | LOCKT",
      description: "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.",
    };
  }

  const url = `${BASE_URL}/storylines/${encodeURIComponent(storyline.slug)}`;
  return {
    title: `${storyline.title} | LOCKT`,
    description: storyline.teaser,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${storyline.title} | LOCKT`,
      description: storyline.teaser,
      url,
      siteName: "LOCKT",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${storyline.title} | LOCKT`,
      description: storyline.teaser,
    },
  };
}

export default async function StorylinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const storyline = getStorylineBySlug(slug);

  if (!storyline) {
    notFound();
  }

  const supabase = await createClient();
  let profile = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const ensured = await ensureProfile(supabase, user);
      profile = ensured.profile ?? null;
    }
  }

  return <StorylineDetailPage storyline={storyline} profile={profile} />;
}
