"use client";

import { useEffect } from "react";
import { ensurePushSubscription } from "@/lib/push/subscription";

export function PushRegistration() {
  useEffect(() => {
    async function setupPush() {
      await ensurePushSubscription({ requestPermission: false });
    }

    setupPush().catch(() => {
      // Silent fail in unsupported environments.
    });
  }, []);

  return null;
}
