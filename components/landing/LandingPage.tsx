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

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-purple-600/24 blur-3xl" />
        <div className="absolute right-[-12rem] top-[9rem] h-[34rem] w-[34rem] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-[22rem] left-[-14rem] h-[32rem] w-[32rem] rounded-full bg-lime-400/16 blur-3xl" />
      </div>

      <Header />
      <HeroSection />
      <HowItWorks />
      <FeatureCards />
      <CountdownSection />
      <SocialLinks />
      <Footer />
    </main>
  );
}
