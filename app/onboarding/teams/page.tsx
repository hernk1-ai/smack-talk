import { TeamsPage } from "@/components/onboarding/TeamsPage";

type TeamsRouteProps = {
  searchParams?: Promise<{
    username?: string;
    avatar?: string;
  }>;
};

export default async function TeamsRoute({ searchParams }: TeamsRouteProps) {
  const params = await searchParams;
  return <TeamsPage avatar={params?.avatar} username={params?.username} />;
}
