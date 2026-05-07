import { ArenaBackground } from "@/components/landing/ArenaBackground";
import { CountdownSection } from "@/components/landing/CountdownSection";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PostHogPageView } from "@/components/landing/PostHogPageView";
import { SocialLinks } from "@/components/landing/SocialLinks";

export function LandingPage() {
  return (
    <main className="landing-atmosphere min-h-dvh overflow-x-hidden bg-[#02040a] text-white">
      <PostHogPageView />

      <Header />
      <div className="relative isolate overflow-hidden">
        <ArenaBackground />
        <HeroSection />
        <HowItWorks />
        <FeatureCards />
      </div>
      <CountdownSection />
      <SocialLinks />
      <Footer />
    </main>
  );
}
