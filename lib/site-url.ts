const LOCAL_FALLBACK = "http://localhost:3000";

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Canonical site origin for links and auth redirects.
 * Prefer NEXT_PUBLIC_SITE_URL in production (e.g. https://getlockt.com).
 */
export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeBaseUrl(window.location.origin);
  }

  return LOCAL_FALLBACK;
}

export function buildSiteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

/** Absolute URL for share sheets and clipboard (never a relative path). */
export function getShareUrl(path: string) {
  return buildSiteUrl(path);
}

export function ensureAbsoluteUrl(urlOrPath: string) {
  const trimmed = urlOrPath.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return getShareUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
}
