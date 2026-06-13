import { VerifyEmailPage } from "@/components/verify-email/VerifyEmailPage";
import { getSafeNextPath } from "@/lib/signup/signupCopy";

type VerifyEmailRouteProps = {
  searchParams?: Promise<{
    email?: string;
    claim?: string;
    next?: string;
  }>;
};

export default async function VerifyEmailRoute({ searchParams }: VerifyEmailRouteProps) {
  const params = await searchParams;

  return (
    <VerifyEmailPage
      email={params?.email}
      isClaimFlow={params?.claim === "1"}
      nextPath={getSafeNextPath(params?.next)}
    />
  );
}
