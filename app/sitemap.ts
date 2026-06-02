import type { MetadataRoute } from "next";
import { worldCupStorylines } from "@/data/worldCupStorylines";
import { getSiteUrl } from "@/lib/site-url";

const publicRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/schedule", priority: 0.9, changeFrequency: "daily" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/rules", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const pages: MetadataRoute.Sitemap = publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: path ? `${baseUrl}${path}` : `${baseUrl}/`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const storylines: MetadataRoute.Sitemap = worldCupStorylines.map((storyline) => ({
    url: `${baseUrl}/storylines/${storyline.slug}`,
    lastModified: new Date(storyline.createdAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...storylines];
}
