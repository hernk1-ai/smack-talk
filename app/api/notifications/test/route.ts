import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = admin as any;
  const { error } = await client.from("notifications").insert({
    user_id: user.id,
    actor_id: null,
    type: "receipt_ready",
    title: "Test notification from LOCKT.",
    body: "Push delivery test is ready.",
    entity_type: "take",
    entity_id: "test",
  });

  if (error) {
    return NextResponse.json({ error: "Unable to create test notification." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
