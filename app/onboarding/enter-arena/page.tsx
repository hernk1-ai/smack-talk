import { EnterArenaPage } from "@/components/onboarding/EnterArenaPage";

type EnterArenaRouteProps = {
  searchParams?: Promise<{
    username?: string;
    avatar?: string;
    teams?: string;
  }>;
};

export default async function EnterArenaRoute({ searchParams }: EnterArenaRouteProps) {
  const params = await searchParams;
  return <EnterArenaPage avatar={params?.avatar} teams={params?.teams} username={params?.username} />;
}
