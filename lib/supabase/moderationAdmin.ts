import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchOpenReports(limit = 100) {
  const supabase = createAdminClient();

  if (!supabase) {
    return { reports: [], error: new Error("Admin client is not configured.") };
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  return { reports: data ?? [], error };
}

export async function updateReportStatus({
  reportId,
  status,
  reviewedBy,
}: {
  reportId: string;
  status: "reviewed" | "dismissed" | "actioned";
  reviewedBy?: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return { report: null, error: new Error("Admin client is not configured.") };
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy ?? null,
    })
    .eq("id", reportId)
    .select("*")
    .single();

  return { report: data, error };
}
