"use client";

export type PushSubscriptionResult =
  | { ok: true; status: "subscribed" | "already-subscribed" }
  | { ok: false; reason: "unsupported" | "missing-vapid-key" | "permission-denied" | "subscribe-failed" };

function toUint8Array(base64UrlString: string) {
  const base64 = base64UrlString.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

async function saveSubscription(subscription: PushSubscription) {
  await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
}

export async function ensurePushSubscription({
  requestPermission,
}: {
  requestPermission?: boolean;
} = {}): Promise<PushSubscriptionResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unsupported" };
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    return { ok: false, reason: "missing-vapid-key" };
  }

  let permission = Notification.permission;
  if (requestPermission && permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { ok: false, reason: "permission-denied" };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await saveSubscription(existing);
      return { ok: true, status: "already-subscribed" };
    }

    const created = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(vapidKey),
    });
    await saveSubscription(created);
    return { ok: true, status: "subscribed" };
  } catch {
    return { ok: false, reason: "subscribe-failed" };
  }
}

