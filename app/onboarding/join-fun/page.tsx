import { EnterArenaPage } from "@/components/onboarding/EnterArenaPage";

type JoinFunRouteProps = {
  searchParams?: Promise<{
    username?: string;
    avatar?: string;
    teams?: string;
  }>;
};

export default async function JoinFunRoute({ searchParams }: JoinFunRouteProps) {
  const params = await searchParams;
  return <EnterArenaPage avatar={params?.avatar} teams={params?.teams} username={params?.username} />;
}

