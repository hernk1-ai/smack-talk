import type { MetadataRoute } from "next";
import { SITEMAP_BASE_URL } from "@/lib/seo/sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/app",
        "/game/",
        "/onboarding/",
        "/settings",
        "/profile",
        "/login",
        "/signup",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/reset-email-sent",
        "/signed-out",
        "/username",
        "/receipts",
        "/receipt/",
        "/take/",
        "/takes/",
        "/matches/",
        "/followers",
        "/following",
        "/calls",
        "/top-talkers",
        "/password-reset-email-preview",
        "/u/",
      ],
    },
    sitemap: `${SITEMAP_BASE_URL}/sitemap.xml`,
  };
}
