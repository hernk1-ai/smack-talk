import { createClient } from "@/lib/supabase/client";
import type { Receipt } from "@/lib/supabase/types";

export async function getCurrentUserReceipts() {
  const supabase = createClient();

  if (!supabase) {
    return { receipts: [] as Receipt[], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { receipts: [] as Receipt[], error: userError ?? new Error("You must be logged in to view receipts.") };
  }

  return getReceiptsByUser(user.id);
}

export async function getReceiptsByUser(userId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { receipts: [] as Receipt[], error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { receipts: data ?? [], error };
}

export async function getReceiptById(receiptId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { receipt: null as Receipt | null, error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase.from("receipts").select("*").eq("id", receiptId).maybeSingle();

  return { receipt: data, error };
}
