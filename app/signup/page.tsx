import { CreateAccountPage } from "@/components/signup/CreateAccountPage";

type SignupRouteProps = {
  searchParams?: Promise<{
    next?: string;
    claim?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupRouteProps) {
  const params = await searchParams;

  return <CreateAccountPage nextPath={params?.next} isClaimFlow={params?.claim === "1"} />;
}
