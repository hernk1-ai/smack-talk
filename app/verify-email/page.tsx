import { VerifyEmailPage } from "@/components/verify-email/VerifyEmailPage";

type VerifyEmailRouteProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function VerifyEmailRoute({ searchParams }: VerifyEmailRouteProps) {
  const params = await searchParams;
  return <VerifyEmailPage email={params?.email} />;
}
