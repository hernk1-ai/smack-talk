import { redirect } from "next/navigation";
import { FollowingPage } from "@/components/social/FollowingPage";
import { createClient } from "@/lib/supabase/server";

export default async function FollowingRoutePage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return <FollowingPage />;
}
