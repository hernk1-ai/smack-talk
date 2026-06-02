import type { MetadataRoute } from "next";

import { worldCupStorylines } from "@/data/worldCupStorylines";
import { getCanonicalSiteUrl } from "@/lib/seo/canonical-site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getCanonicalSiteUrl();
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/schedule`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const storylinePages: MetadataRoute.Sitemap = worldCupStorylines.map((storyline) => ({
    url: `${siteUrl}/storylines/${storyline.slug}`,
    lastModified: new Date(storyline.createdAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...storylinePages];
}
