import { ResetEmailSentPage } from "@/components/reset-access/ResetAccessPages";

type ResetEmailSentRouteProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function ResetEmailSentRoute({ searchParams }: ResetEmailSentRouteProps) {
  const params = await searchParams;
  return <ResetEmailSentPage email={params?.email} />;
}
