"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { isGoogleAnalyticsEnabled, pageview } from "@/lib/analytics/gtag";

function GoogleAnalyticsPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled()) {
      return;
    }

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    // Initial page view is sent by gtag('config') in <head>; track client navigations only.
    if (lastTrackedUrl.current !== null && lastTrackedUrl.current !== url) {
      pageview(url);
    }

    lastTrackedUrl.current = url;
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalyticsPageView() {
  if (!isGoogleAnalyticsEnabled()) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsPageViewTracker />
    </Suspense>
  );
}
