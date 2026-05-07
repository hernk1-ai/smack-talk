import { CountdownSection } from "@/components/landing/CountdownSection";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SocialLinks } from "@/components/landing/SocialLinks";

export function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#02040a] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-purple-600/25 blur-3xl" />
        <div className="absolute right-[-10rem] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-teal-400/12 blur-3xl" />
        <div className="absolute bottom-[12rem] left-[-10rem] h-[24rem] w-[24rem] rounded-full bg-sky-500/10 blur-3xl" />
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
