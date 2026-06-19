import type { MetadataRoute } from "next";
import { SITEMAP_BASE_URL } from "@/lib/seo/sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/auth/",
        "/settings",
        "/game/*/room/",
      ],
    },
    sitemap: `${SITEMAP_BASE_URL}/sitemap.xml`,
  };
}
