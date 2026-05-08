import { ArenaBackground } from "@/components/landing/ArenaBackground";
import { CountdownSection } from "@/components/landing/CountdownSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { LiveTakesTicker } from "@/components/landing/LiveTakesTicker";
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
        <LiveTakesTicker />
        <FeatureCards />
      </div>
      <CountdownSection />
      <SocialLinks />
      <FAQSection />
      <Footer />
    </main>
  );
}
