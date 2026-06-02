"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { isGoogleAnalyticsEnabled, pageview } from "@/lib/analytics/gtag";

function GoogleAnalyticsPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled()) {
      return;
    }

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    pageview(url);
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
