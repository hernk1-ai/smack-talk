import { NextRequest, NextResponse } from "next/server";
import { sendEmailNotificationStub, sendPushNotification, validateFanoutEnv } from "@/lib/notifications/fanout";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  return runFanout(request);
}

export async function POST(request: NextRequest) {
  return runFanout(request);
}

async function runFanout(request: NextRequest) {
  const bearer = request.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice("Bearer ".length) : "";
  const configuredSecret = process.env.NOTIFICATION_FANOUT_SECRET;
  if (!configuredSecret || token !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized fanout request." }, { status: 401 });
  }

  const validation = validateFanoutEnv();
  if (!validation.ok) {
    return NextResponse.json(
      { error: `Missing notification environment: ${validation.missing.join(", ")}` },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = admin as any;

  const { data: enqueueCount, error: enqueueError } = await client.rpc("enqueue_notification_fanout", { batch_size: 300 });
  if (enqueueError) {
    return NextResponse.json({ error: "Unable to enqueue notification fanout jobs." }, { status: 500 });
  }

  const { data: pendingRows, error: pendingError } = await client
    .from("notification_fanout_queue")
    .select("id, notification_id, user_id, channel, status, attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(200);

  if (pendingError) {
    return NextResponse.json({ error: "Unable to load pending fanout jobs." }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of pendingRows ?? []) {
    try {
      if (row.channel === "push") {
        const { data: notification } = await client
          .from("notifications")
          .select("id, title, body, entity_type, entity_id")
          .eq("id", row.notification_id)
          .maybeSingle();

        if (!notification) {
          await client
            .from("notification_fanout_queue")
            .update({
              status: "skipped",
              last_error: "Notification not found.",
              attempts: (row.attempts ?? 0) + 1,
              processed_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          skipped += 1;
          continue;
        }

        const { data: subs } = await client
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .eq("user_id", row.user_id)
          .eq("is_active", true)
          .limit(10);

        if (!subs?.length) {
          await client
            .from("notification_fanout_queue")
            .update({
              status: "skipped",
              last_error: "No active push subscription.",
              attempts: (row.attempts ?? 0) + 1,
              processed_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          skipped += 1;
          continue;
        }

        let sentForUser = 0;
        for (const sub of subs) {
          try {
            await sendPushNotification({
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
              payload: {
                title: notification.title,
                body: notification.body ?? "Open LOCKT for updates.",
                url: resolveNotificationUrl(notification.entity_type, notification.entity_id),
              },
            });
            sentForUser += 1;
          } catch (error) {
            const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
            if (statusCode === 404 || statusCode === 410) {
              await client
                .from("push_subscriptions")
                .update({ is_active: false })
                .eq("id", sub.id);
            }
          }
        }

        if (sentForUser <= 0) {
          await client
            .from("notification_fanout_queue")
            .update({
              status: "failed",
              attempts: (row.attempts ?? 0) + 1,
              last_error: "Push send failed for all subscriptions.",
              processed_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          await client
            .from("notifications")
            .update({ delivery_error: "Push send failed." })
            .eq("id", row.notification_id);
          failed += 1;
          continue;
        }

        await client
          .from("notification_fanout_queue")
          .update({
            status: "sent",
            attempts: (row.attempts ?? 0) + 1,
            provider_message_id: `webpush_${row.id}`,
            processed_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        await client
          .from("notifications")
          .update({ push_sent_at: new Date().toISOString(), delivery_error: null })
          .eq("id", row.notification_id);
        sent += 1;
        continue;
      }

      if (row.channel === "email") {
        const emailResult = await sendEmailNotificationStub();
        await client
          .from("notification_fanout_queue")
          .update({
            status: emailResult.skipped ? "skipped" : "sent",
            attempts: (row.attempts ?? 0) + 1,
            last_error: emailResult.reason ?? null,
            processed_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (!emailResult.skipped) {
          await client
            .from("notifications")
            .update({ email_sent_at: new Date().toISOString(), delivery_error: null })
            .eq("id", row.notification_id);
          sent += 1;
        } else {
          skipped += 1;
        }
      }
    } catch (error) {
      await client
        .from("notification_fanout_queue")
        .update({
          status: "failed",
          attempts: (row.attempts ?? 0) + 1,
          last_error: error instanceof Error ? error.message : "Unknown fanout failure.",
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      await client
        .from("notifications")
        .update({ delivery_error: error instanceof Error ? error.message.slice(0, 500) : "Unknown fanout failure." })
        .eq("id", row.notification_id);
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    enqueued: enqueueCount ?? 0,
    processed: (pendingRows ?? []).length,
    sent,
    skipped,
    failed,
  });
}

function resolveNotificationUrl(entityType?: string | null, entityId?: string | null) {
  if (entityType === "take" && entityId) return `/take/${encodeURIComponent(entityId)}`;
  if (entityType === "follow") return "/following";
  return "/receipts";
}
