import { FAQSection } from "@/components/landing/FAQSection";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { MobilePreviewSection } from "@/components/landing/MobilePreviewSection";
import { PostHogPageView } from "@/components/landing/PostHogPageView";

export function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent text-white">
      <PostHogPageView />

      <Header />
      <div className="relative isolate">
        <HeroSection />
        <MobilePreviewSection />
        <FeatureCards />
      </div>
      <FAQSection />
      <Footer />
    </main>
  );
}
