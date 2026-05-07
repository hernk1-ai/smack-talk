"use client";

import { useEffect } from "react";
import { captureLandingEvent, initPostHog } from "@/utils/posthogClient";

export function PostHogPageView() {
  useEffect(() => {
    initPostHog();
    captureLandingEvent("landing_page_view");
  }, []);

  return null;
}
