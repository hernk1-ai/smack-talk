import webpush from "web-push";
import { notificationFanoutSecret, vapidPrivateKey, vapidPublicKey } from "@/lib/supabase/env";

export function validateFanoutEnv() {
  const missing: string[] = [];
  if (!vapidPublicKey) missing.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  if (!vapidPrivateKey) missing.push("VAPID_PRIVATE_KEY");
  if (!notificationFanoutSecret) missing.push("NOTIFICATION_FANOUT_SECRET");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { ok: missing.length === 0, missing };
}

let vapidConfigured = false;

export function configureWebPush() {
  if (vapidConfigured) return;
  if (!vapidPublicKey || !vapidPrivateKey) return;
  webpush.setVapidDetails("mailto:support@getlockt.com", vapidPublicKey, vapidPrivateKey);
  vapidConfigured = true;
}

export async function sendPushNotification({
  endpoint,
  p256dh,
  auth,
  payload,
}: {
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: { title: string; body: string; url: string };
}) {
  configureWebPush();
  return webpush.sendNotification(
    {
      endpoint,
      keys: { p256dh, auth },
    },
    JSON.stringify(payload),
  );
}

export async function sendEmailNotificationStub() {
  // TODO: Add provider integration (Resend/Postmark/SendGrid).
  return { skipped: true as const, reason: "Email provider not configured." };
}
