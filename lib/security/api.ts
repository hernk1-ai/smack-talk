import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function requireAuthenticatedUser() {
  const supabase = await createClient();

  if (!supabase) {
    return { supabase: null, user: null, error: jsonError("Supabase is not configured.", 503) };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { supabase, user: null, error: jsonError("Unable to verify session.", 401) };
  }

  if (!user) {
    return { supabase, user: null, error: jsonError("Join the Game Room or log in to continue.", 401) };
  }

  return { supabase, user, error: null };
}

export function enforceRateLimit({
  request,
  userId,
  action,
  limit,
  windowMs,
}: {
  request: Request;
  userId?: string;
  action: string;
  limit: number;
  windowMs: number;
}) {
  const ip = getRequestIp(request);
  const key = userId ? `${action}:user:${userId}` : `${action}:ip:${ip}`;
  const result = checkRateLimit({ key, limit, windowMs });

  if (!result.allowed) {
    const payload = rateLimitResponse(result.retryAfterMs);
    return jsonError(payload.error, 429);
  }

  return null;
}
