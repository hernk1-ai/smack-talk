import { redirect } from "next/navigation";

export default async function TakesAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/take/${id}`);
}
