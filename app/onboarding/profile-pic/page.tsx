import { ProfilePicPage } from "@/components/onboarding/ProfilePicPage";

type ProfilePicRouteProps = {
  searchParams?: Promise<{
    username?: string;
  }>;
};

export default async function ProfilePicRoute({ searchParams }: ProfilePicRouteProps) {
  const params = await searchParams;
  return <ProfilePicPage username={params?.username} />;
}
