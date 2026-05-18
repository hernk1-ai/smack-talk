import { redirect } from "next/navigation";

export default async function UserProfileRoutePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  redirect(`/receipts/${encodeURIComponent(username)}`);
}
