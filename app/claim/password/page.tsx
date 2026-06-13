import { ClaimPasswordPage } from "@/components/claim/ClaimPasswordPage";

type ClaimPasswordRouteProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function ClaimPasswordRoute({ searchParams }: ClaimPasswordRouteProps) {
  const params = await searchParams;
  return <ClaimPasswordPage nextPath={params?.next} />;
}
