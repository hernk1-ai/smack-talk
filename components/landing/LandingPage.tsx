import { ArenaBackground } from "@/components/landing/ArenaBackground";
import { CountdownSection } from "@/components/landing/CountdownSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { PostHogPageView } from "@/components/landing/PostHogPageView";

export function LandingPage() {
  return (
    <main className="landing-atmosphere min-h-dvh overflow-x-hidden bg-[#02040a] text-white">
      <PostHogPageView />

      <Header />
      <div className="relative isolate overflow-hidden">
        <ArenaBackground />
        <HeroSection />
        <CountdownSection />
        <FeatureCards />
      </div>
      <FAQSection />
      <Footer />
    </main>
  );
}
