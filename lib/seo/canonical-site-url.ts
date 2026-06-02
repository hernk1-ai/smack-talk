/** Canonical origin for SEO (sitemap, robots, Open Graph). Prefer www in production. */
export function getCanonicalSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let base = configured || "https://www.getlockt.com";
  base = base.endsWith("/") ? base.slice(0, -1) : base;

  if (base === "https://getlockt.com") {
    return "https://www.getlockt.com";
  }

  return base;
}
