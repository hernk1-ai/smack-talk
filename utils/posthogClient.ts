"use client";

import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let hasInitializedPostHog = false;

export function initPostHog() {
  if (typeof window === "undefined" || hasInitializedPostHog || !posthogKey) {
    return;
  }

  posthog.init(posthogKey, {
    api_host: posthogHost || "https://us.i.posthog.com",
    capture_pageview: false,
  });

  hasInitializedPostHog = true;
}

export function captureLandingEvent(eventName: string, properties?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || !posthogKey) {
    return;
  }

  initPostHog();
  posthog.capture(eventName, {
    source: "landing_page",
    ...properties,
  });
}
