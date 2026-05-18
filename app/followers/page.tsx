import { redirect } from "next/navigation";
import { FollowersPage } from "@/components/social/FollowersPage";
import { createClient } from "@/lib/supabase/server";

export default async function FollowersRoutePage() {
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
  return <FollowersPage />;
}
