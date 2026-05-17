const LOCAL_FALLBACK = "http://localhost:3000";

export function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!rawUrl) {
    return LOCAL_FALLBACK;
  }

  return rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
}

export function buildSiteUrl(path: string) {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

